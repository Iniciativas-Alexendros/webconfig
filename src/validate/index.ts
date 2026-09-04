import { promises as fs } from "node:fs";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { validateSyntax } from "./syntax.js";
import { runSemanticValidation } from "./semantic.js";
import { loadDSCatalog, type DSCatalog } from "./ds-catalog.js";
import type { ValidationIssue, ValidationResult, ErrorCode } from "./errors.js";
import { groupBySeverity, createIssue, ErrorCode as EC, ErrorSeverity } from "./errors.js";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findDSCatalog(bundleDir: string, explicitPath?: string): string {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  const parentDir = path.dirname(bundleDir);
  const defaultPath = path.join(parentDir, "ds-catalog.yaml");
  return defaultPath;
}

async function loadBundleFromTar(tarPath: string): Promise<string> {
  const tar = await import("tar-stream");
  const zlib = await import("node:zlib");
  const tmpDir = await fs.mkdtemp(path.join(path.dirname(tarPath), "webconfig-"));
  
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    const gunzip = zlib.createGunzip();
    const readStream = createReadStream(tarPath);
    
    readStream.pipe(gunzip).pipe(extract as unknown as NodeJS.WritableStream);
    
    extract.on("entry", async (header: { name: string }, stream: NodeJS.ReadableStream, next: () => void) => {
      const filePath = path.join(tmpDir, header.name);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const writeStream = createWriteStream(filePath);
      stream.pipe(writeStream);
      stream.on("end", next);
      stream.resume();
    });
    
    extract.on("finish", () => {
      resolve(tmpDir);
    });
    
    extract.on("error", reject);
  });
}

async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
  }
}

export interface ValidateOptions {
  bundlePath: string;
  dsCatalogPath?: string | undefined;
  strict?: boolean | undefined;
  json?: boolean | undefined;
}

export async function validateBundle(options: ValidateOptions): Promise<ValidationResult> {
  let bundleDir = options.bundlePath;
  let tempDir: string | null = null;
  let isTar = false;

  if (bundleDir.endsWith(".tar.gz") || bundleDir.endsWith(".tgz")) {
    isTar = true;
    tempDir = await loadBundleFromTar(bundleDir);
    bundleDir = tempDir;
  }

  try {
    const dsCatalogPath = findDSCatalog(bundleDir, options.dsCatalogPath);
    let catalog: DSCatalog;
    try {
      catalog = loadDSCatalog(dsCatalogPath);
    } catch (e) {
      const error = e instanceof Error ? e.message : "Unknown error";
      return groupBySeverity([
        createIssue(EC.COMP_001, dsCatalogPath, `Failed to load DS catalog: ${error}`),
      ]);
    }

    const [syntaxIssues, semanticIssues] = await Promise.all([
      validateSyntax(bundleDir),
      runSemanticValidation(bundleDir, dsCatalogPath),
    ]);

    const allIssues = [...syntaxIssues, ...semanticIssues];
    const result = groupBySeverity(allIssues);

    if (options.strict) {
      result.valid = result.errors.length === 0 && result.warnings.length === 0;
    }

    return result;
  } finally {
    if (tempDir && isTar) {
      await cleanupTempDir(tempDir);
    }
  }
}

export function formatValidationResult(result: ValidationResult, json: boolean = false): string {
  if (json) {
    return JSON.stringify({
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
    }, null, 2);
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
  
  if (lines.length === 0) {
    lines.push("✓ Valid bundle (no errors or warnings)");
  }
  
  return lines.join("\n");
}

export function getExitCode(result: ValidationResult, strict: boolean = false): number {
  if (result.errors.length > 0) return 1;
  if (strict && result.warnings.length > 0) return 1;
  return 0;
}