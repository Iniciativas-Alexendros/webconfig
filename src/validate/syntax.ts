import AjvModule from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AjvClass = new (opts: any) => {
  compile: (schema: object) => ValidateFn;
  addFormat?: unknown;
  addKeyword?: unknown;
};
interface ValidateFn {
  (data: unknown): boolean;
  errors?: Array<{ keyword?: string; instancePath?: string; message?: string; params?: unknown }> | null;
}
const AjvConstructor = (AjvModule as unknown as { default: AjvClass; Ajv2020?: AjvClass }).default;
const addFormatsFn = (addFormatsModule as unknown as { default: (ajv: unknown) => unknown }).default;

import { promises as fs } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { ValidationIssue } from "./errors.js";

import manifestSchema from "../../schemas/manifest.schema.json" with { type: "json" };
import siteConfigSchema from "../../schemas/site-config.schema.json" with { type: "json" };
import compositionSchema from "../../schemas/composition.schema.json" with { type: "json" };
import contentSchema from "../../schemas/content.schema.json" with { type: "json" };
import seoSchema from "../../schemas/seo.schema.json" with { type: "json" };

const ajv = new AjvConstructor({ strict: false, allErrors: true, verbose: true });
addFormatsFn(ajv);

type AjvInstance = typeof ajv;
const schemaCache = new Map<string, ReturnType<AjvInstance["compile"]>>();

const SCHEMAS: Record<string, object> = {
  manifest: manifestSchema,
  siteConfig: siteConfigSchema,
  composition: compositionSchema,
  content: contentSchema,
  seo: seoSchema,
};

async function loadSchema(name: string): Promise<ReturnType<AjvInstance["compile"]>> {
  if (schemaCache.has(name)) {
    return schemaCache.get(name)!;
  }
  const schema = SCHEMAS[name];
  if (!schema) {
    throw new Error(`Unknown schema: ${name}`);
  }
  const validate = ajv.compile(schema);
  schemaCache.set(name, validate);
  return validate;
}

function mapAjvErrors(
  errors: Array<{ keyword?: string; instancePath?: string; message?: string }> | null | undefined,
  file: string
): ValidationIssue[] {
  if (!errors) return [];
  return errors.map((err) => ({
    code: `SYNTAX_${err.keyword?.toUpperCase() || "ERROR"}`,
    severity: "error" as const,
    file,
    message: `${err.instancePath || "/"} ${err.message}`,
    location: undefined,
  }));
}

function mapManifestErrors(
  errors: Array<{ keyword?: string; instancePath?: string; message?: string; params?: unknown }> | null | undefined,
  file: string
): ValidationIssue[] {
  if (!errors) return [];
  return errors.map((err) => {
    if (err.keyword === "required") {
      const missing = (err.params as { missingProperty?: string }).missingProperty ?? "field";
      return {
        code: "MANIFEST_001",
        severity: "error" as const,
        file,
        message: `Manifest missing required field: ${missing}`,
        location: undefined,
      };
    }
    return {
      code: `SYNTAX_${err.keyword?.toUpperCase() || "ERROR"}`,
      severity: "error" as const,
      file,
      message: `${err.instancePath || "/"} ${err.message}`,
      location: undefined,
    };
  });
}

export async function validateSyntax(bundleDir: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const manifestPath = path.join(bundleDir, "manifest.yaml");
  const siteConfigPath = path.join(bundleDir, "site.config.yaml");

  try {
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    const manifest = parseYaml(manifestContent);
    const validateManifest = await loadSchema("manifest");
    const valid = validateManifest(manifest);
    if (!valid) {
      issues.push(...mapManifestErrors(validateManifest.errors, "manifest.yaml"));
    }
  } catch (e) {
    issues.push({
      code: "SYNTAX_ERROR",
      severity: "error",
      file: "manifest.yaml",
      message: e instanceof Error ? e.message : "Failed to parse manifest.yaml",
    });
  }

  try {
    const siteConfigContent = await fs.readFile(siteConfigPath, "utf-8");
    const siteConfig = parseYaml(siteConfigContent);
    const validateSiteConfig = await loadSchema("siteConfig");
    const valid = validateSiteConfig(siteConfig);
    if (!valid) {
      issues.push(...mapAjvErrors(validateSiteConfig.errors, "site.config.yaml"));
    }
  } catch (e) {
    issues.push({
      code: "SYNTAX_ERROR",
      severity: "error",
      file: "site.config.yaml",
      message: e instanceof Error ? e.message : "Failed to parse site.config.yaml",
    });
  }

  const compositionDir = path.join(bundleDir, "composition");
  try {
    const entries = await fs.readdir(compositionDir);
    const validateComposition = await loadSchema("composition");
    for (const entry of entries) {
      if (!entry.endsWith(".yaml") && !entry.endsWith(".yml")) continue;
      const filePath = path.join(compositionDir, entry);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const data = parseYaml(content);
        const valid = validateComposition(data);
        if (!valid) {
          issues.push(...mapAjvErrors(validateComposition.errors, `composition/${entry}`));
        }
      } catch (e) {
        issues.push({
          code: "SYNTAX_ERROR",
          severity: "error",
          file: `composition/${entry}`,
          message: e instanceof Error ? e.message : `Failed to parse ${entry}`,
        });
      }
    }
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      issues.push({
        code: "SYNTAX_ERROR",
        severity: "error",
        file: "composition/",
        message: e instanceof Error ? e.message : "Failed to read composition/ directory",
      });
    }
  }

  const contentDir = path.join(bundleDir, "content");
  try {
    const locales = await fs.readdir(contentDir);
    const validateContent = await loadSchema("content");
    for (const locale of locales) {
      const localeDir = path.join(contentDir, locale);
      const stat = await fs.stat(localeDir);
      if (!stat.isDirectory()) continue;

      const contentFiles = await fs.readdir(localeDir);
      for (const file of contentFiles) {
        if (!file.endsWith(".json") && !file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
        const filePath = path.join(localeDir, file);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          let data: unknown;
          if (file.endsWith(".json")) {
            data = JSON.parse(content);
          } else {
            data = parseYaml(content);
          }

          const valid = validateContent(data);
          if (!valid) {
            const relPath = path.relative(bundleDir, filePath);
            issues.push(...mapAjvErrors(validateContent.errors, relPath));
          }
        } catch (e) {
          const relPath = path.relative(bundleDir, filePath);
          issues.push({
            code: "SYNTAX_ERROR",
            severity: "error",
            file: relPath,
            message: e instanceof Error ? e.message : `Failed to parse ${file}`,
          });
        }
      }
    }
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      issues.push({
        code: "SYNTAX_ERROR",
        severity: "error",
        file: "content/",
        message: e instanceof Error ? e.message : "Failed to read content/ directory",
      });
    }
  }

  const seoDir = path.join(contentDir, "seo");
  try {
    const seoLocales = await fs.readdir(seoDir);
    const validateSeo = await loadSchema("seo");
    for (const locale of seoLocales) {
      const localeDir = path.join(seoDir, locale);
      const stat = await fs.stat(localeDir);
      if (!stat.isDirectory()) continue;

      const seoFiles = await fs.readdir(localeDir);
      for (const file of seoFiles) {
        if (!file.endsWith(".yaml") && !file.endsWith(".yml") && !file.endsWith(".json")) continue;
        const filePath = path.join(localeDir, file);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const data = parseYaml(content);
          const valid = validateSeo(data);
          if (!valid) {
            const relPath = path.relative(bundleDir, filePath);
            issues.push(...mapAjvErrors(validateSeo.errors, relPath));
          }
        } catch (e) {
          const relPath = path.relative(bundleDir, filePath);
          issues.push({
            code: "SYNTAX_ERROR",
            severity: "error",
            file: relPath,
            message: e instanceof Error ? e.message : `Failed to parse ${file}`,
          });
        }
      }
    }
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      issues.push({
        code: "SYNTAX_ERROR",
        severity: "error",
        file: "content/seo/",
        message: e instanceof Error ? e.message : "Failed to read content/seo/ directory",
      });
    }
  }

  return issues;
}
