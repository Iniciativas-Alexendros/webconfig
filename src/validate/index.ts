import path from "node:path";
import { validateSyntax } from "./syntax.js";
import { runSemanticValidation } from "./semantic.js";
import { loadDSCatalog, type DSCatalog } from "./ds-catalog.js";
import { extractTar } from "../tar.js";
import type { ValidationResult } from "./errors.js";
import { groupBySeverity, createIssue, ErrorCode as EC } from "./errors.js";

function findDSCatalog(bundleDir: string, explicitPath?: string): string {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const parentDir = path.dirname(bundleDir);
  const defaultPath = path.join(parentDir, "ds-catalog.yaml");
  return defaultPath;
}

async function loadBundleFromTar(tarPath: string): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  return extractTar(tarPath);
}

export interface ValidateOptions {
  bundlePath: string;
  dsCatalogPath?: string | undefined;
  strict?: boolean | undefined;
  json?: boolean | undefined;
}

export async function validateBundle(options: ValidateOptions): Promise<ValidationResult> {
  let bundleDir = options.bundlePath;
  let cleanupTemp: (() => Promise<void>) | null = null;

  if (bundleDir.endsWith(".tar.gz") || bundleDir.endsWith(".tgz")) {
    const { dir, cleanup } = await loadBundleFromTar(bundleDir);
    bundleDir = dir;
    cleanupTemp = cleanup;
  }

  try {
    const dsCatalogPath = findDSCatalog(bundleDir, options.dsCatalogPath);
    let catalog: DSCatalog;
    try {
      catalog = loadDSCatalog(dsCatalogPath);
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      return groupBySeverity([createIssue(EC.COMP_001, dsCatalogPath, `Failed to load DS catalog: ${error}`)]);
    }

    const [syntaxIssues, semanticIssues] = await Promise.all([
      validateSyntax(bundleDir),
      runSemanticValidation(bundleDir, catalog),
    ]);

    const allIssues = [...syntaxIssues, ...semanticIssues];
    const result = groupBySeverity(allIssues);

    if (options.strict) {
      result.valid = result.errors.length === 0 && result.warnings.length === 0;
    }

    return result;
  } finally {
    if (cleanupTemp) {
      await cleanupTemp();
    }
  }
}

export function formatValidationResult(result: ValidationResult, json: boolean = false): string {
  if (json) {
    return JSON.stringify(
      {
        errors: result.errors.map((e) => ({
          code: e.code,
          severity: e.severity,
          file: e.file,
          message: e.message,
          location: e.location,
        })),
        warnings: result.warnings.map((w) => ({
          code: w.code,
          severity: w.severity,
          file: w.file,
          message: w.message,
          location: w.location,
        })),
        valid: result.valid,
      },
      null,
      2
    );
  }

  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push("ERRORS:");
    for (const issue of result.errors) {
      const loc = issue.location ? ` (line ${issue.location.line}, col ${issue.location.column})` : "";
      lines.push(`  [${issue.code}] ${issue.file}${loc}: ${issue.message}`);
    }
  }

  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("WARNINGS:");
    for (const issue of result.warnings) {
      const loc = issue.location ? ` (line ${issue.location.line}, col ${issue.location.column})` : "";
      lines.push(`  [${issue.code}] ${issue.file}${loc}: ${issue.message}`);
    }
  }

  if (result.errors.length === 0) {
    if (result.warnings.length > 0) {
      const n = result.warnings.length;
      lines.push(`✓ Valid bundle (${n} warning${n === 1 ? "" : "s"})`);
    } else {
      lines.push("✓ Valid bundle (no errors or warnings)");
    }
  }

  return lines.join("\n");
}

export function getExitCode(result: ValidationResult, strict: boolean = false): number {
  if (result.errors.length > 0) return 1;
  if (strict && result.warnings.length > 0) return 1;
  return 0;
}
