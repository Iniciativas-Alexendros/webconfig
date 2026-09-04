import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export interface FileIntegrity {
  path: string;
  hash: string;
  size: number;
}

export interface BundleIntegrity {
  files: FileIntegrity[];
  globalHash: string;
}

function sha256File(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

function walkDir(dir: string, base: string = dir): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, base));
    } else if (entry.isFile()) {
      files.push(relative(base, fullPath));
    }
  }
  return files.sort();
}

export function computeIntegrity(bundleDir: string): BundleIntegrity {
  const absoluteDir = resolve(bundleDir);
  const files = walkDir(absoluteDir);
  const fileIntegrities: FileIntegrity[] = [];

  for (const file of files) {
    const fullPath = join(absoluteDir, file);
    const stats = statSync(fullPath);
    const hash = sha256File(fullPath);
    fileIntegrities.push({
      path: file,
      hash,
      size: stats.size,
    });
  }

  const sortedHashes = fileIntegrities.map((f) => f.hash).sort();
  const globalHash = createHash("sha256").update(sortedHashes.join("")).digest("hex");

  return {
    files: fileIntegrities,
    globalHash,
  };
}

export function verifyIntegrity(bundleDir: string, expectedGlobalHash: string): boolean {
  const integrity = computeIntegrity(bundleDir);
  return integrity.globalHash === expectedGlobalHash;
}