import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { loadDSCatalog, type DSComponent, type DSCatalog } from "./ds-catalog.js";
import type { ValidationIssue, ErrorCode } from "./errors.js";
import { createIssue, ErrorCode as EC, ErrorSeverity } from "./errors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BundleData {
  manifest: Record<string, unknown>;
  siteConfig: Record<string, unknown>;
  compositions: Map<string, Record<string, unknown>>;
  content: Map<string, Record<string, unknown>>;
  seo: Map<string, Record<string, unknown>>;
  assets: Set<string>;
}

const SECRET_PATTERNS: Array<{ pattern: RegExp; code: "SECRET_001" | "CRYPTO_001" }> = [
  { pattern: /AKIA[0-9A-Z]{16}/, code: "SECRET_001" },
  { pattern: /(sk|pk)-[A-Za-z0-9]{20,}/, code: "SECRET_001" },
  { pattern: /ghp_|gho_[A-Za-z0-9]{36}/, code: "SECRET_001" },
  { pattern: /github_pat_/, code: "SECRET_001" },
  { pattern: /xox[abprs]-/, code: "SECRET_001" },
  { pattern: /glpat-/, code: "SECRET_001" },
  { pattern: /-----BEGIN .* PRIVATE KEY-----/, code: "SECRET_001" },
  { pattern: /Authorization: Bearer \S{20,}/, code: "SECRET_001" },
  { pattern: /(api[_-]?key|secret|token|password|passwd|pwd)\s*[=:]\s*\S+/i, code: "CRYPTO_001" },
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
      } catch {
      }
      
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
      } catch {
      }
    }
  } catch {
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
          const relPath = path.relative(bundleDir, fullPath);
          data.assets.add(relPath);
        }
      }
    }
    await scanAssets(assetsDir);
  } catch {
  }

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
        if (img["url"] && typeof img["url"] === "string") {
          assets.add(img["url"]);
        }
      }
    }
    const twitter = seo["twitter"] as Record<string, unknown> | undefined;
    if (twitter?.["images"]) {
      for (const img of twitter["images"] as string[]) {
        assets.add(img);
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
  for (const { pattern, code } of SECRET_PATTERNS) {
    const matches = str.match(pattern);
    if (matches) {
      issues.push(createIssue(code as ErrorCode, file, `${code}: ${matches[0].substring(0, 50)}`));
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

function checkIconsInObject(obj: Record<string, unknown>, file: string, whitelist: Set<string>, issues: ValidationIssue[]): void {
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
  issues: ValidationIssue[]
): void {
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const v = value as Record<string, unknown>;
      const href = v["href"];
      if (href !== undefined && typeof href === "string") {
        if (href.startsWith("http://")) {
          issues.push(createIssue(EC.LINK_002, file, `External link uses http: ${href}`));
        } else if (href.startsWith("#")) {
          const anchorId = href.slice(1);
          if (!pageSlugs.has(anchorId) && !/^[a-z-]+$/.test(anchorId)) {
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
          if (anchorId && !pageSlugs.has(anchorId) && !/^[a-z-]+$/.test(anchorId)) {
            issues.push(createIssue(EC.LINK_003, file, `Anchor link points to non-existent element ID: ${anchorId}`));
          }
        }
      }
      checkLinks(v, file, pageSlugs, issues);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") {
          checkLinks(item as Record<string, unknown>, file, pageSlugs, issues);
        }
      }
    }
  }
}

function checkSeoLengths(seo: Record<string, unknown>, file: string, issues: ValidationIssue[]): void {
  const title = seo["title"];
  if (title && typeof title === "string" && title.length > 60) {
    issues.push(createIssue(EC.SEO_001, file, `SEO title exceeds 60 characters (${title.length})`));
  }
  const description = seo["description"];
  if (description && typeof description === "string" && description.length > 160) {
    issues.push(createIssue(EC.SEO_001, file, `SEO description exceeds 160 characters (${description.length})`));
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

async function validateSemantic(
  bundleDir: string,
  catalog: DSCatalog
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const componentIndex = new Map<string, DSComponent>();
  for (const comp of catalog.components) {
    componentIndex.set(comp.id, comp);
  }
  const layoutComponentIds = new Set(
    catalog.components.filter((c) => c.category === "layout").map((c) => c.id)
  );

  function extractIconEnums(schema: Record<string, unknown>): string[] {
    const icons: string[] = [];
    for (const value of Object.values(schema)) {
      if (value && typeof value === "object") {
        const v = value as Record<string, unknown>;
        // Check if this object has an enum directly
        if (v["enum"] && Array.isArray(v["enum"])) {
          icons.push(...v["enum"].filter((x): x is string => typeof x === "string"));
        }
        // Recurse into items (for arrays)
        if (v["items"] && typeof v["items"] === "object") {
          icons.push(...extractIconEnums(v["items"] as Record<string, unknown>));
        }
        // Recurse into properties (for objects)
        if (v["properties"] && typeof v["properties"] === "object") {
          icons.push(...extractIconEnums(v["properties"] as Record<string, unknown>));
        }
      }
    }
    return icons;
  }

  const iconWhitelist = new Set(
    catalog.components.flatMap((c) => {
      const schema = c.propsSchema as Record<string, unknown> | undefined;
      if (!schema) return [];
      return extractIconEnums(schema);
    })
  );

  const data = await loadBundleData(bundleDir);

  const siteConfig = data.siteConfig;
  const locales = (siteConfig["locales"] as string[]) || [];
  const defaultLocale = (siteConfig["defaultLocale"] as string) || "es";
  const fallbackLocale = (siteConfig["fallbackLocale"] as string) || "es";

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

  for (const [name, composition] of data.compositions) {
    const components = composition["components"] as Array<Record<string, unknown>> | undefined;
    if (!components) continue;
    for (const comp of components) {
      const compType = comp["type"] as string;
      const compId = comp["id"] as string;
      const parentId = comp["parentId"] as string | null | undefined;
      const props = comp["props"] as Record<string, unknown> | undefined;

      if (!componentIndex.has(compType)) {
        issues.push(createIssue(EC.COMP_001, `composition/${name}.yaml`, `Component type "${compType}" not found in DS catalog`));
      }

      if (parentId && !compositionComponentTypes.has(parentId)) {
        issues.push(createIssue(EC.PARENT_001, `composition/${name}.yaml`, `Component ${compId} references non-existent parent_id: ${parentId}`));
      } else if (parentId) {
        const parentType = compositionComponentTypes.get(parentId);
        if (parentType && !layoutComponentIds.has(parentType)) {
          issues.push(createIssue(EC.PARENT_002, `composition/${name}.yaml`, `parent_id must reference a layout component (category: layout), got parent of type: ${parentType}`));
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
        checkPrice(props, `composition/${name}.yaml`, issues);
        checkPricesInObject(props, `composition/${name}.yaml`, issues);
        checkImageAlt(props, `composition/${name}.yaml`, issues);
        checkImagesInObject(props, `composition/${name}.yaml`, issues);
        checkLinks(props, `composition/${name}.yaml`, pageSlugs, issues);
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
      checkLinks(values, `content/${key}`, pageSlugs, issues);
      checkContentRefs(values, `content/${key}`, pageSlugs, data.content, locales, issues);
    }
  }

  for (const [key, seo] of data.seo) {
    checkSeoLengths(seo, `content/${key}`, issues);
    checkSecretsInObject(seo, `content/${key}`, issues);
  }

  for (const locale of locales) {
    const hasContent = Array.from(data.content.keys()).some((k) => k.startsWith(`${locale}/`));
    if (!hasContent && locale !== fallbackLocale) {
      issues.push(createIssue(EC.I18N_002, `content/${locale}/`, `Locale ${locale} missing content; will fallback to ${fallbackLocale}`));
    }
  }

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
  const bundleVersion = manifest["bundleVersion"] as string | undefined;
  if (bundleVersion !== "1.0.0") {
    issues.push(createIssue(EC.MANIFEST_002, "manifest.yaml", `Manifest bundleVersion does not match schema version: ${bundleVersion}`));
  }

  return issues;
}

function validateComponentProps(
  component: DSComponent,
  props: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!component.propsSchema) {
    return { valid: true, errors: [] };
  }
  const schema = component.propsSchema as Record<string, { type?: string; required?: boolean; properties?: Record<string, unknown> }>;
  for (const [key, propSchema] of Object.entries(schema)) {
    if (propSchema.required && !(key in props)) {
      errors.push(`Missing required prop: ${key}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export async function runSemanticValidation(
  bundleDir: string,
  catalogPath: string
): Promise<ValidationIssue[]> {
  const catalog = loadDSCatalog(catalogPath);
  return validateSemantic(bundleDir, catalog);
}