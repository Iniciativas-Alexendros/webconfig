import AjvModule from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import { parse as parseYaml } from "yaml";
import type { ValidationIssue } from "./errors.js";

import manifestSchema from "../../schemas/manifest.schema.json" with { type: "json" };
import siteConfigSchema from "../../schemas/site-config.schema.json" with { type: "json" };
import compositionSchema from "../../schemas/composition.schema.json" with { type: "json" };
import contentSchema from "../../schemas/content.schema.json" with { type: "json" };
import seoSchema from "../../schemas/seo.schema.json" with { type: "json" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AjvClass = new (opts: any) => {
  compile: (schema: object) => ValidateFn;
};
interface ValidateFn {
  (data: unknown): boolean;
  errors?: Array<{ keyword?: string; instancePath?: string; message?: string; params?: unknown }> | null;
}

const AjvConstructor = (AjvModule as unknown as { default: AjvClass }).default;
const addFormatsFn = (addFormatsModule as unknown as { default: (ajv: unknown) => unknown }).default;

const ajv = new AjvConstructor({ strict: false, allErrors: true, verbose: true });
addFormatsFn(ajv);

export type SchemaKind = "manifest" | "siteConfig" | "composition" | "content" | "seo";

const SCHEMAS: Record<SchemaKind, object> = {
  manifest: manifestSchema,
  siteConfig: siteConfigSchema,
  composition: compositionSchema,
  content: contentSchema,
  seo: seoSchema,
};

const compiled = new Map<SchemaKind, ValidateFn>();

function validatorFor(kind: SchemaKind): ValidateFn {
  const cached = compiled.get(kind);
  if (cached) return cached;
  const validate = ajv.compile(SCHEMAS[kind]);
  compiled.set(kind, validate);
  return validate;
}

function mapAjvErrors(
  errors: Array<{ keyword?: string; instancePath?: string; message?: string }> | null | undefined,
  file: string
): ValidationIssue[] {
  if (!errors || errors.length === 0) return [];
  return errors.map((err) => ({
    code: `SYNTAX_${(err.keyword ?? "ERROR").toUpperCase()}`,
    severity: "error" as const,
    file,
    message: `${err.instancePath || "/"} ${err.message ?? "invalid value"}`,
  }));
}

function mapManifestErrors(
  errors: Array<{ keyword?: string; instancePath?: string; message?: string; params?: unknown }> | null | undefined,
  file: string
): ValidationIssue[] {
  if (!errors || errors.length === 0) return [];
  return errors.map((err) => {
    if (err.keyword === "required") {
      const missing = (err.params as { missingProperty?: string } | undefined)?.missingProperty ?? "field";
      return {
        code: "MANIFEST_001",
        severity: "error" as const,
        file,
        message: `Manifest missing required field: ${missing}`,
      };
    }
    return {
      code: `SYNTAX_${(err.keyword ?? "ERROR").toUpperCase()}`,
      severity: "error" as const,
      file,
      message: `${err.instancePath || "/"} ${err.message ?? "invalid value"}`,
    };
  });
}

export function messageFromUnknown(error: unknown, file: string): string {
  if (error instanceof Error && error.message) return error.message;
  return `Failed to parse ${file}`;
}

function parseDocument(kind: SchemaKind, content: string, file: string): unknown {
  if (kind === "content" && file.endsWith(".json")) return JSON.parse(content);
  return parseYaml(content);
}

export function validateFileContent(kind: SchemaKind, content: string, file: string): ValidationIssue[] {
  try {
    const data = parseDocument(kind, content, file);
    const validate = validatorFor(kind);
    if (validate(data)) return [];
    return kind === "manifest" ? mapManifestErrors(validate.errors, file) : mapAjvErrors(validate.errors, file);
  } catch (error) {
    return [
      {
        code: "SYNTAX_ERROR",
        severity: "error",
        file,
        message: messageFromUnknown(error, file),
      },
    ];
  }
}

const COMPOSITION_RE = /^composition\/[^/]+\.ya?ml$/;
const CONTENT_RE = /^content\/(?!seo\/)[^/]+\/[^/]+\.(json|ya?ml)$/;
const SEO_RE = /^content\/seo\/[^/]+\/[^/]+\.(json|ya?ml)$/;

function missing(file: string): ValidationIssue {
  return {
    code: "SYNTAX_ERROR",
    severity: "error",
    file,
    message: `Missing ${file}`,
  };
}

/**
 * Validación de esquema AJV sobre un mapa ruta → texto.
 * No lee disco: la usa la GUI (File API) y la CLI tras leer los ficheros.
 * No ejecuta reglas semánticas ni exporta tar.
 */
export function validateSyntaxDocuments(files: ReadonlyMap<string, string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const names = [...files.keys()].sort();

  const manifest = files.get("manifest.yaml");
  if (manifest === undefined) issues.push(missing("manifest.yaml"));
  else issues.push(...validateFileContent("manifest", manifest, "manifest.yaml"));

  const siteConfig = files.get("site.config.yaml");
  if (siteConfig === undefined) issues.push(missing("site.config.yaml"));
  else issues.push(...validateFileContent("siteConfig", siteConfig, "site.config.yaml"));

  for (const name of names) {
    if (!COMPOSITION_RE.test(name)) continue;
    const content = files.get(name);
    if (content !== undefined) issues.push(...validateFileContent("composition", content, name));
  }
  for (const name of names) {
    if (!CONTENT_RE.test(name)) continue;
    const content = files.get(name);
    if (content !== undefined) issues.push(...validateFileContent("content", content, name));
  }
  for (const name of names) {
    if (!SEO_RE.test(name)) continue;
    const content = files.get(name);
    if (content !== undefined) issues.push(...validateFileContent("seo", content, name));
  }

  return issues;
}
