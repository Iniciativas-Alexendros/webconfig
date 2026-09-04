import Ajv from "ajv";
import addFormats from "ajv-formats";

const AjvConstructor = Ajv.default;
const addFormatsFn = addFormats.default;

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ValidationIssue, ErrorCode } from "./errors.js";

import manifestSchema from "../../schemas/manifest.schema.json" with { type: "json" };
import siteConfigSchema from "../../schemas/site-config.schema.json" with { type: "json" };
import compositionSchema from "../../schemas/composition.schema.json" with { type: "json" };
import contentSchema from "../../schemas/content.schema.json" with { type: "json" };
import seoSchema from "../../schemas/seo.schema.json" with { type: "json" };

const ajv = new AjvConstructor({ strict: false, allErrors: true, verbose: true });
addFormatsFn(ajv);

const schemaCache = new Map<string, Ajv.ValidateFunction>();

const SCHEMAS: Record<string, object> = {
  manifest: manifestSchema,
  siteConfig: siteConfigSchema,
  composition: compositionSchema,
  content: contentSchema,
  seo: seoSchema,
};

async function loadSchema(name: string): Promise<Ajv.ValidateFunction> {
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

function mapAjvErrors(errors: Ajv.ErrorObject[] | null | undefined, file: string): ValidationIssue[] {
  if (!errors) return [];
  return errors.map((err) => ({
    code: `SYNTAX_${err.keyword?.toUpperCase() || "ERROR"}` as ErrorCode,
    severity: "error" as const,
    file,
    message: `${err.instancePath || "/"} ${err.message}`,
    location: undefined,
  }));
}

function mapManifestErrors(errors: Ajv.ErrorObject[] | null | undefined, file: string): ValidationIssue[] {
  if (!errors) return [];
  return errors.map((err) => {
    if (err.keyword === "required") {
      const missing = (err.params as { missingProperty?: string }).missingProperty ?? "field";
      return {
        code: "MANIFEST_001" as ErrorCode,
        severity: "error" as const,
        file,
        message: `Manifest missing required field: ${missing}`,
        location: undefined,
      };
    }
    return {
      code: `SYNTAX_${err.keyword?.toUpperCase() || "ERROR"}` as ErrorCode,
      severity: "error" as const,
      file,
      message: `${err.instancePath || "/"} ${err.message}`,
      location: undefined,
    };
  });
}

export async function validateSyntax(
  bundleDir: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const manifestPath = path.join(bundleDir, "manifest.yaml");
  const siteConfigPath = path.join(bundleDir, "site.config.yaml");

  try {
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    const yaml = await import("yaml");
    const manifest = yaml.parse(manifestContent);
    const validateManifest = await loadSchema("manifest");
    const valid = validateManifest(manifest);
    if (!valid) {
      issues.push(...mapManifestErrors(validateManifest.errors, "manifest.yaml"));
    }
  } catch (e) {
    issues.push({
      code: "SYNTAX_ERROR" as ErrorCode,
      severity: "error",
      file: "manifest.yaml",
      message: e instanceof Error ? e.message : "Failed to parse manifest.yaml",
    });
  }

  try {
    const siteConfigContent = await fs.readFile(siteConfigPath, "utf-8");
    const yaml = await import("yaml");
    const siteConfig = yaml.parse(siteConfigContent);
    const validateSiteConfig = await loadSchema("siteConfig");
    const valid = validateSiteConfig(siteConfig);
    if (!valid) {
      issues.push(...mapAjvErrors(validateSiteConfig.errors, "site.config.yaml"));
    }
  } catch (e) {
    issues.push({
      code: "SYNTAX_ERROR" as ErrorCode,
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
        const yaml = await import("yaml");
        const data = yaml.parse(content);
        const valid = validateComposition(data);
        if (!valid) {
          issues.push(...mapAjvErrors(validateComposition.errors, `composition/${entry}`));
        }
      } catch (e) {
        issues.push({
          code: "SYNTAX_ERROR" as ErrorCode,
          severity: "error",
          file: `composition/${entry}`,
          message: e instanceof Error ? e.message : `Failed to parse ${entry}`,
        });
      }
    }
  } catch {
  }

  const contentDir = path.join(bundleDir, "content");
  try {
    const locales = await fs.readdir(contentDir);
    const validateContent = await loadSchema("content");
    const validateSeo = await loadSchema("seo");
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
            const yaml = await import("yaml");
            data = yaml.parse(content);
          }

          const isSeo = path.basename(filePath).startsWith("seo") || filePath.includes("seo");
          const validator = isSeo ? validateSeo : validateContent;
          const valid = validator(data);
          if (!valid) {
            const relPath = path.relative(bundleDir, filePath);
            issues.push(...mapAjvErrors(validator.errors, relPath));
          }
        } catch (e) {
          const relPath = path.relative(bundleDir, filePath);
          issues.push({
            code: "SYNTAX_ERROR" as ErrorCode,
            severity: "error",
            file: relPath,
            message: e instanceof Error ? e.message : `Failed to parse ${file}`,
          });
        }
      }
    }
  } catch {
  }

  return issues;
}