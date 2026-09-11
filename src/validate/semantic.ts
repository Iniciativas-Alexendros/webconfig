import { promises as fs } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { BUNDLE_VERSION, BUNDLE_VERSION_RE, SCHEMA_COMPAT_RE, SEO_DESC_MAX, SEO_TITLE_MAX } from "../constants.js";
import { computeGlobalHash, computeIntegrity } from "../integrity.js";
import type { DSCatalog } from "./ds-catalog.js";
import { createComponentIndex, getIconWhitelist, validateComponentProps } from "./ds-catalog.js";
import type { ValidationIssue } from "./errors.js";
import { createIssue, ErrorCode as EC } from "./errors.js";

interface BundleData {
  manifest: Record<string, unknown>;
  siteConfig: Record<string, unknown>;
  compositions: Map<string, Record<string, unknown>>;
  content: Map<string, Record<string, unknown>>;
  seo: Map<string, Record<string, unknown>>;
  assets: Set<string>;
  structureIssues: ValidationIssue[];
}

const SECRET_PATTERNS: Array<{ pattern: RegExp; code: "SECRET_001" | "CRYPTO_001"; name: string }> = [
  { pattern: /AKIA[0-9A-Z]{16}/, code: "SECRET_001", name: "AWS access key" },
  { pattern: /(sk|pk)-[A-Za-z0-9]{20,}/, code: "SECRET_001", name: "Stripe API key" },
  { pattern: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}/, code: "SECRET_001", name: "GitHub token" },
  { pattern: /github_pat_[A-Za-z0-9_]{22,}/, code: "SECRET_001", name: "GitHub fine-grained PAT" },
  { pattern: /xox[abprs]-[A-Za-z0-9-]{10,}/, code: "SECRET_001", name: "Slack token" },
  { pattern: /glpat-[A-Za-z0-9_-]{20}/, code: "SECRET_001", name: "GitLab personal access token" },
  { pattern: /-----BEGIN .* PRIVATE KEY-----/, code: "SECRET_001", name: "private key" },
  {
    pattern: /\b(?:api[_-]?key|secret|token|password|passwd|pwd)\b\s*[=:]\s*\S+/i,
    code: "CRYPTO_001",
    name: "credential assignment",
  },
];

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

async function loadBundleData(bundleDir: string): Promise<BundleData> {
  const data: BundleData = {
    manifest: {},
    siteConfig: {},
    compositions: new Map(),
    content: new Map(),
    seo: new Map(),
    assets: new Set(),
    structureIssues: [],
  };

  const manifestPath = path.join(bundleDir, "manifest.yaml");
  const manifestContent = await fs.readFile(manifestPath, "utf-8");
  data.manifest = parse(manifestContent) as Record<string, unknown>;

  const siteConfigPath = path.join(bundleDir, "site.config.yaml");
  const siteConfigContent = await fs.readFile(siteConfigPath, "utf-8");
  data.siteConfig = parse(siteConfigContent) as Record<string, unknown>;

  const compositionDir = path.join(bundleDir, "composition");
  try {
    const entries = await fs.readdir(compositionDir);
    for (const entry of entries) {
      if (!entry.endsWith(".yaml") && !entry.endsWith(".yml")) continue;
      const filePath = path.join(compositionDir, entry);
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = parse(content) as Record<string, unknown>;
      data.compositions.set(entry.replace(/\.ya?ml$/, ""), parsed);
    }
  } catch {
    data.structureIssues.push(createIssue(EC.STRUCT_001, "composition/", "Missing required composition/ directory"));
  }

  const contentDir = path.join(bundleDir, "content");
  try {
    const entries = await fs.readdir(contentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const locale = entry.name;

      // Read regular content files from content/<locale>/
      const localeDir = path.join(contentDir, locale);
      try {
        const files = await fs.readdir(localeDir);
        for (const file of files) {
          if (!file.endsWith(".json") && !file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
          const filePath = path.join(localeDir, file);
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) continue;
          const content = await fs.readFile(filePath, "utf-8");
          let parsed: unknown;
          if (file.endsWith(".json")) {
            parsed = JSON.parse(content);
          } else {
            parsed = parse(content);
          }
          const key = `${locale}/${file}`;
          data.content.set(key, parsed as Record<string, unknown>);
        }
      } catch {}

      // Read SEO files from content/seo/<locale>/
      const seoLocaleDir = path.join(contentDir, "seo", locale);
      try {
        const seoFiles = await fs.readdir(seoLocaleDir);
        for (const file of seoFiles) {
          if (!file.endsWith(".json") && !file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
          const filePath = path.join(seoLocaleDir, file);
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) continue;
          const content = await fs.readFile(filePath, "utf-8");
          let parsed: unknown;
          if (file.endsWith(".json")) {
            parsed = JSON.parse(content);
          } else {
            parsed = parse(content);
          }
          const key = `${locale}/seo/${file}`;
          data.seo.set(key, parsed as Record<string, unknown>);
        }
      } catch {}
    }
  } catch {
    data.structureIssues.push(createIssue(EC.STRUCT_001, "content/", "Missing required content/ directory"));
  }

  const assetsDir = path.join(bundleDir, "assets");
  try {
    async function scanAssets(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scanAssets(fullPath);
        } else {
          const relPath = path.relative(bundleDir, fullPath).split(path.sep).join("/");
          data.assets.add(relPath);
        }
      }
    }
    await scanAssets(assetsDir);
  } catch {}

  return data;
}

function extractPageSlugs(compositions: Map<string, Record<string, unknown>>): Set<string> {
  const slugs = new Set<string>();
  for (const [name] of compositions) {
    slugs.add(name);
  }
  return slugs;
}

function extractReferencedAssets(data: BundleData): Set<string> {
  const assets = new Set<string>();
  for (const [, composition] of data.compositions) {
    const components = composition["components"] as Array<Record<string, unknown>> | undefined;
    if (!components) continue;
    for (const comp of components) {
      const props = comp["props"] as Record<string, unknown> | undefined;
      if (!props) continue;
      collectAssetPaths(props, assets);
    }
  }
  for (const [, content] of data.content) {
    const blocks = content["blocks"] as Array<Record<string, unknown>> | undefined;
    if (!blocks) continue;
    for (const block of blocks) {
      const values = block["values"] as Record<string, unknown> | undefined;
      if (!values) continue;
      collectAssetPaths(values, assets);
    }
  }
  for (const [, seo] of data.seo) {
    const openGraph = seo["openGraph"] as Record<string, unknown> | undefined;
    if (openGraph?.["images"]) {
      for (const img of openGraph["images"] as Array<Record<string, unknown>>) {
        const url = img["url"];
        if (typeof url === "string" && (url.startsWith("assets/") || url.startsWith("./assets/"))) {
          assets.add(url.replace(/^\.\//, ""));
        }
      }
    }
    const twitter = seo["twitter"] as Record<string, unknown> | undefined;
    if (twitter?.["images"]) {
      for (const img of twitter["images"] as string[]) {
        if (typeof img === "string" && (img.startsWith("assets/") || img.startsWith("./assets/"))) {
          assets.add(img.replace(/^\.\//, ""));
        }
      }
    }
  }
  return assets;
}

function collectAssetPaths(obj: Record<string, unknown>, assets: Set<string>): void {
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      if (value.startsWith("assets/") || value.startsWith("./assets/")) {
        assets.add(value.replace(/^\.\//, ""));
      }
    } else if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object") {
            collectAssetPaths(item as Record<string, unknown>, assets);
          }
        }
      } else {
        collectAssetPaths(value as Record<string, unknown>, assets);
      }
    }
  }
}

function checkSecretsInString(str: string, file: string, issues: ValidationIssue[]): void {
  for (const { pattern, code, name } of SECRET_PATTERNS) {
    const matches = str.match(pattern);
    if (matches) {
      issues.push(createIssue(code, file, `${code}: possible ${name} detected (value omitted for security)`));
    }
  }
}

function checkSecretsInObject(obj: Record<string, unknown>, file: string, issues: ValidationIssue[]): void {
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      checkSecretsInString(value, file, issues);
    } else if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object") {
            checkSecretsInObject(item as Record<string, unknown>, file, issues);
          }
        }
      } else {
        checkSecretsInObject(value as Record<string, unknown>, file, issues);
      }
    }
  }
}

function checkRichTextForHtml(obj: Record<string, unknown>, file: string, issues: ValidationIssue[]): void {
  const htmlRegex = /<[^>]+>/;
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      if (htmlRegex.test(value)) {
        issues.push(createIssue(EC.RICHTEXT_001, file, "HTML tags detected in rich-text field"));
      }
    } else if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object") {
            checkRichTextForHtml(item as Record<string, unknown>, file, issues);
          }
        }
      } else {
        checkRichTextForHtml(value as Record<string, unknown>, file, issues);
      }
    }
  }
}

function checkIcon(value: unknown, file: string, whitelist: Set<string>, issues: ValidationIssue[]): void {
  if (typeof value === "string") {
    if (whitelist.has(value)) return;
    if (EMOJI_REGEX.test(value)) return;
    issues.push(createIssue(EC.ICON_001, file, `Icon "${value}" not in whitelist and not a valid Unicode pictograph`));
  }
}

function checkIconsInObject(
  obj: Record<string, unknown>,
  file: string,
  whitelist: Set<string>,
  issues: ValidationIssue[]
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (key === "icon") {
      checkIcon(value, file, whitelist, issues);
    } else if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object") {
            checkIconsInObject(item as Record<string, unknown>, file, whitelist, issues);
          }
        }
      } else {
        checkIconsInObject(value as Record<string, unknown>, file, whitelist, issues);
      }
    }
  }
}

function checkPrice(obj: Record<string, unknown>, file: string, issues: ValidationIssue[]): void {
  const amount = obj["amount"];
  const currency = obj["currency"];
  const period = obj["period"];
  if (amount !== undefined || currency !== undefined || period !== undefined) {
    if (typeof amount !== "number" || amount < 0) {
      issues.push(createIssue(EC.PRICE_001, file, "Price missing or invalid amount"));
    }
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
      issues.push(createIssue(EC.PRICE_001, file, "Price missing or invalid currency (must be ISO 4217)"));
    }
    if (typeof period !== "string" || !["month", "year", "once", "session"].includes(period)) {
      issues.push(createIssue(EC.PRICE_001, file, "Price missing or invalid period"));
    }
  }
}

function checkPricesInObject(obj: Record<string, unknown>, file: string, issues: ValidationIssue[]): void {
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const v = value as Record<string, unknown>;
      const hasPriceFields = v["amount"] !== undefined || v["currency"] !== undefined || v["period"] !== undefined;
      if (hasPriceFields) {
        checkPrice(v, file, issues);
      }
      checkPricesInObject(v, file, issues);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") {
          checkPricesInObject(item as Record<string, unknown>, file, issues);
        }
      }
    }
  }
}

function checkImageAlt(obj: Record<string, unknown>, file: string, issues: ValidationIssue[]): void {
  if (obj["src"] !== undefined && obj["alt"] === undefined) {
    issues.push(createIssue(EC.A11Y_001, file, "Image missing alt text"));
  }
}

function checkImagesInObject(obj: Record<string, unknown>, file: string, issues: ValidationIssue[]): void {
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const v = value as Record<string, unknown>;
      if (v["src"] !== undefined) {
        checkImageAlt(v, file, issues);
      }
      checkImagesInObject(v, file, issues);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") {
          checkImagesInObject(item as Record<string, unknown>, file, issues);
        }
      }
    }
  }
}

function checkLinks(
  obj: Record<string, unknown>,
  file: string,
  pageSlugs: Set<string>,
  elementIdsByPage: Map<string, Set<string>>,
  currentPage: string,
  issues: ValidationIssue[]
): void {
  const hasElementId = (page: string, anchorId: string): boolean => {
    const ids = elementIdsByPage.get(page);
    return ids !== undefined && ids.has(anchorId);
  };
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const v = value as Record<string, unknown>;
      const href = v["href"];
      if (href !== undefined && typeof href === "string") {
        if (href.startsWith("http://")) {
          issues.push(createIssue(EC.LINK_002, file, `External link uses http: ${href}`));
        } else if (href.startsWith("#")) {
          const anchorId = href.slice(1);
          if (!hasElementId(currentPage, anchorId)) {
            issues.push(createIssue(EC.LINK_003, file, `Anchor link points to non-existent element ID: ${anchorId}`));
          }
        } else if (href.startsWith("/") && !href.startsWith("//")) {
          // Handle anchor links like /page#anchor
          const hashIndex = href.indexOf("#");
          const pagePath = hashIndex >= 0 ? href.substring(0, hashIndex) : href;
          const anchorId = hashIndex >= 0 ? href.substring(hashIndex + 1) : "";

          const page = pagePath.split("/")[1] || "home";
          if (!pageSlugs.has(page) && page !== "") {
            issues.push(createIssue(EC.LINK_001, file, `Internal link points to non-existent page: ${href}`));
          }
          // Also validate anchor if present
          if (anchorId && !hasElementId(page, anchorId)) {
            issues.push(createIssue(EC.LINK_003, file, `Anchor link points to non-existent element ID: ${anchorId}`));
          }
        }
      }
      checkLinks(v, file, pageSlugs, elementIdsByPage, currentPage, issues);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") {
          checkLinks(item as Record<string, unknown>, file, pageSlugs, elementIdsByPage, currentPage, issues);
        }
      }
    }
  }
}

function checkSeoLengths(seo: Record<string, unknown>, file: string, issues: ValidationIssue[]): void {
  const title = seo["title"];
  if (title && typeof title === "string" && title.length > SEO_TITLE_MAX) {
    issues.push(createIssue(EC.SEO_001, file, `SEO title exceeds ${SEO_TITLE_MAX} characters (${title.length})`));
  }
  const description = seo["description"];
  if (description && typeof description === "string" && description.length > SEO_DESC_MAX) {
    issues.push(
      createIssue(EC.SEO_001, file, `SEO description exceeds ${SEO_DESC_MAX} characters (${description.length})`)
    );
  }
  const jsonLd = seo["jsonLd"] as Record<string, unknown> | undefined;
  if (jsonLd && (!jsonLd["@context"] || !jsonLd["@type"])) {
    issues.push(createIssue(EC.SEO_002, file, "SEO jsonLd missing required @context or @type"));
  }
}

function checkContentRefs(
  obj: Record<string, unknown>,
  file: string,
  pageSlugs: Set<string>,
  contentData: Map<string, Record<string, unknown>>,
  locales: string[],
  issues: ValidationIssue[]
): void {
  for (const value of Object.values(obj)) {
    if (typeof value === "string" && value.includes("#/")) {
      const match = value.match(/^([^.]+)\.json#\/(.+)$/);
      if (!match) {
        issues.push(createIssue(EC.CONTENTREF_002, file, `Invalid content reference syntax: ${value}`));
        continue;
      }
      const page = match[1] as string;
      const key = match[2] as string;
      // Extract page slug (last part after /)
      const pageSlug = page.split("/").pop() || page;
      if (!pageSlugs.has(pageSlug)) {
        issues.push(createIssue(EC.CONTENTREF_001, file, `Content reference points to non-existent page: ${page}`));
        continue;
      }
      // Check all locales for the content file
      let found = false;
      for (const locale of locales) {
        const contentKey = `${locale}/${pageSlug}.json`;
        const contentFile = contentData.get(contentKey);
        if (!contentFile) continue;
        const blocks = contentFile["blocks"] as Array<Record<string, unknown>> | undefined;
        if (!blocks) continue;
        const block = blocks.find((b) => b["id"] === key);
        if (block) {
          found = true;
          break;
        }
      }
      if (!found) {
        issues.push(createIssue(EC.CONTENTREF_003, file, `Content reference key not found: ${key}`));
      }
    } else if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object") {
            checkContentRefs(item as Record<string, unknown>, file, pageSlugs, contentData, locales, issues);
          }
        }
      } else {
        checkContentRefs(value as Record<string, unknown>, file, pageSlugs, contentData, locales, issues);
      }
    }
  }
}

function checkLocaleFallback(
  content: Map<string, Record<string, unknown>>,
  seo: Map<string, Record<string, unknown>>,
  locales: string[],
  defaultLocale: string,
  issues: ValidationIssue[]
): void {
  if (locales.length <= 1) return;
  const configured = new Set(locales);

  const contentByFile = new Map<string, Map<string, Set<string>>>();
  for (const [key, record] of content) {
    const slash = key.indexOf("/");
    if (slash < 0) continue;
    const locale = key.slice(0, slash);
    const file = key.slice(slash + 1);
    const blocks = (record["blocks"] as Array<Record<string, unknown>> | undefined) || [];
    const ids = new Set<string>();
    for (const b of blocks) {
      if (typeof b["id"] === "string") ids.add(b["id"]);
    }
    if (!contentByFile.has(file)) contentByFile.set(file, new Map());
    contentByFile.get(file)?.set(locale, ids);
  }

  const seoByFile = new Map<string, Map<string, Set<string>>>();
  for (const [key, record] of seo) {
    const parts = key.split("/");
    if (parts.length < 3) continue;
    const locale = parts[0] as string;
    const file = parts[2] as string;
    if (!seoByFile.has(file)) seoByFile.set(file, new Map());
    seoByFile.get(file)?.set(locale, new Set(Object.keys(record)));
  }

  function walk(
    byFile: Map<string, Map<string, Set<string>>>,
    labelFor: (locale: string, file: string) => string
  ): void {
    for (const [file, perLocale] of byFile) {
      const defaultSet = perLocale.get(defaultLocale);
      if (!defaultSet) continue;
      const union = new Set<string>();
      for (const s of perLocale.values()) {
        for (const k of s) union.add(k);
      }
      for (const k of union) {
        for (const locale of configured) {
          if (locale === defaultLocale) continue;
          const activeSet = perLocale.get(locale);
          if (activeSet && activeSet.has(k)) continue;
          if (defaultSet.has(k)) {
            issues.push(
              createIssue(EC.I18N_002, labelFor(locale, file), `#/${k} resolved via fallback to ${defaultLocale}`)
            );
          } else {
            issues.push(
              createIssue(EC.CONTENTREF_003, labelFor(locale, file), `Content reference key not found: ${k}`)
            );
          }
        }
      }
    }
  }

  walk(contentByFile, (locale, file) => `content/${locale}/${file}`);
  walk(seoByFile, (locale, file) => `content/seo/${locale}/${file}`);
}

async function validateSemantic(bundleDir: string, catalog: DSCatalog): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const componentIndex = createComponentIndex(catalog);
  const layoutComponentIds = new Set(catalog.components.filter((c) => c.category === "layout").map((c) => c.id));

  const iconWhitelist = new Set(getIconWhitelist(catalog));

  const data = await loadBundleData(bundleDir);
  issues.push(...data.structureIssues);

  const siteConfig = data.siteConfig;
  const locales = (siteConfig["locales"] as string[]) || [];
  const defaultLocale = (siteConfig["defaultLocale"] as string) || "es";

  // Build a map of composition component IDs to their types for parent validation
  const compositionComponentTypes = new Map<string, string>();
  for (const [, composition] of data.compositions) {
    const components = composition["components"] as Array<Record<string, unknown>> | undefined;
    if (!components) continue;
    for (const comp of components) {
      const compId = comp["id"] as string;
      const compType = comp["type"] as string;
      if (compId && compType) {
        compositionComponentTypes.set(compId, compType);
      }
    }
  }

  const pageSlugs = extractPageSlugs(data.compositions);

  const elementIdsByPage = new Map<string, Set<string>>();
  for (const [name, composition] of data.compositions) {
    const components = composition["components"] as Array<Record<string, unknown>> | undefined;
    if (!components) continue;
    const ids = new Set<string>();
    for (const comp of components) {
      const compId = comp["id"] as string;
      if (compId) ids.add(compId);
    }
    elementIdsByPage.set(name, ids);
  }

  for (const [name, composition] of data.compositions) {
    const components = composition["components"] as Array<Record<string, unknown>> | undefined;
    if (!components) continue;
    for (const comp of components) {
      const compType = comp["type"] as string;
      const compId = comp["id"] as string;
      const parentId = comp["parentId"] as string | null | undefined;
      const props = comp["props"] as Record<string, unknown> | undefined;

      if (!componentIndex.has(compType)) {
        issues.push(
          createIssue(EC.COMP_001, `composition/${name}.yaml`, `Component type "${compType}" not found in DS catalog`)
        );
      }

      if (parentId && !compositionComponentTypes.has(parentId)) {
        issues.push(
          createIssue(
            EC.PARENT_001,
            `composition/${name}.yaml`,
            `Component ${compId} references non-existent parent_id: ${parentId}`
          )
        );
      } else if (parentId) {
        const parentType = compositionComponentTypes.get(parentId);
        if (parentType && !layoutComponentIds.has(parentType)) {
          issues.push(
            createIssue(
              EC.PARENT_002,
              `composition/${name}.yaml`,
              `parent_id must reference a layout component (category: layout), got parent of type: ${parentType}`
            )
          );
        }
      }

      if (props) {
        const dsComp = componentIndex.get(compType);
        if (dsComp) {
          const propValidation = validateComponentProps(dsComp, props);
          for (const err of propValidation.errors) {
            issues.push(createIssue(EC.COMP_002, `composition/${name}.yaml`, `${compType}.${err}`));
          }
        }
        checkSecretsInObject(props, `composition/${name}.yaml`, issues);
        checkRichTextForHtml(props, `composition/${name}.yaml`, issues);
        checkIconsInObject(props, `composition/${name}.yaml`, iconWhitelist, issues);
        checkPricesInObject(props, `composition/${name}.yaml`, issues);
        checkImagesInObject(props, `composition/${name}.yaml`, issues);
        checkLinks(props, `composition/${name}.yaml`, pageSlugs, elementIdsByPage, name, issues);
        checkContentRefs(props, `composition/${name}.yaml`, pageSlugs, data.content, locales, issues);
      }
    }
  }

  for (const [key, content] of data.content) {
    const blocks = content["blocks"] as Array<Record<string, unknown>> | undefined;
    if (!blocks) continue;
    for (const block of blocks) {
      const values = block["values"] as Record<string, unknown> | undefined;
      if (!values) continue;
      checkSecretsInObject(values, `content/${key}`, issues);
      checkRichTextForHtml(values, `content/${key}`, issues);
      checkIconsInObject(values, `content/${key}`, iconWhitelist, issues);
      checkPricesInObject(values, `content/${key}`, issues);
      checkImagesInObject(values, `content/${key}`, issues);
      const pageSlug =
        key
          .split("/")
          .pop()
          ?.replace(/\.(json|ya?ml)$/, "") ?? "";
      checkLinks(values, `content/${key}`, pageSlugs, elementIdsByPage, pageSlug, issues);
      checkContentRefs(values, `content/${key}`, pageSlugs, data.content, locales, issues);
    }
  }

  for (const [key, seo] of data.seo) {
    checkSeoLengths(seo, `content/${key}`, issues);
    checkSecretsInObject(seo, `content/${key}`, issues);
  }

  checkLocaleFallback(data.content, data.seo, locales, defaultLocale, issues);

  const referencedAssets = extractReferencedAssets(data);
  for (const asset of referencedAssets) {
    if (!data.assets.has(asset)) {
      issues.push(createIssue(EC.ASSET_001, asset, `Referenced asset file does not exist: ${asset}`));
    }
  }
  for (const asset of data.assets) {
    if (!referencedAssets.has(asset)) {
      issues.push(createIssue(EC.ASSET_002, asset, `Asset file exists but is not referenced: ${asset}`));
    }
  }

  const manifest = data.manifest;
  const siteConfigFile = manifest["siteConfig"] as string | undefined;
  if (siteConfigFile) {
    const siteConfigPath = path.join(bundleDir, siteConfigFile);
    try {
      await fs.access(siteConfigPath);
    } catch {
      const missingFile = siteConfigFile;
      issues.push(createIssue(EC.MANIFEST_001, "manifest.yaml", `Manifest references non-existent ${missingFile}`));
    }
  }

  checkSecretsInObject(manifest, "manifest.yaml", issues);
  checkSecretsInObject(siteConfig, "site.config.yaml", issues);
  const bundleVersion = manifest["bundleVersion"] as string | undefined;
  if (bundleVersion === undefined || !BUNDLE_VERSION_RE.test(bundleVersion)) {
    issues.push(
      createIssue(EC.MANIFEST_002, "manifest.yaml", `Manifest bundleVersion is not valid semver: ${bundleVersion}`)
    );
  } else if (bundleVersion !== BUNDLE_VERSION) {
    issues.push(
      createIssue(
        EC.MANIFEST_002,
        "manifest.yaml",
        `Manifest bundleVersion does not match schema version: ${bundleVersion}`
      )
    );
  }

  const schemaCompat = manifest["schema_compat"] as string | undefined;
  if (schemaCompat !== undefined && !SCHEMA_COMPAT_RE.test(schemaCompat)) {
    issues.push(
      createIssue(EC.MANIFEST_002, "manifest.yaml", `Incompatible schema_compat constraint: ${schemaCompat}`)
    );
  }

  const integrity = manifest["integrity"] as { files?: Record<string, string>; global?: string } | undefined;
  if (integrity && typeof integrity === "object") {
    const declaredFiles = integrity["files"] ?? {};
    const actual = computeIntegrity(bundleDir);
    const actualByPath = new Map(actual.files.map((f) => [f.path, f.hash]));

    for (const [filePath, declaredHash] of Object.entries(declaredFiles)) {
      const actualHash = actualByPath.get(filePath);
      if (!actualHash || actualHash !== declaredHash) {
        issues.push(createIssue(EC.INTEGRITY_001, "manifest.yaml", `File integrity hash mismatch for ${filePath}`));
      }
    }

    for (const file of actual.files) {
      if (!(file.path in declaredFiles)) {
        issues.push(createIssue(EC.INTEGRITY_001, "manifest.yaml", `File integrity hash mismatch for ${file.path}`));
      }
    }

    const expectedGlobal = computeGlobalHash(declaredFiles);
    if (integrity["global"] !== expectedGlobal) {
      issues.push(createIssue(EC.INTEGRITY_002, "manifest.yaml", "Global integrity hash mismatch"));
    }
  }

  return issues;
}

export async function runSemanticValidation(bundleDir: string, catalog: DSCatalog): Promise<ValidationIssue[]> {
  return validateSemantic(bundleDir, catalog);
}
