import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { walkDirSync } from "./fs-utils.js";

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

export function computeGlobalHash(files: Record<string, string>): string {
  return createHash("sha256")
    .update(
      Object.keys(files)
        .sort()
        .map((p) => `${p}\0${files[p]}`)
        .join("")
    )
    .digest("hex");
}

export function computeIntegrity(bundleDir: string): BundleIntegrity {
  const absoluteDir = resolve(bundleDir);
  const files = walkDirSync(absoluteDir);
  const fileIntegrities: FileIntegrity[] = [];

  for (const file of files) {
    if (file === "manifest.yaml") continue;
    const fullPath = join(absoluteDir, file);
    const stats = statSync(fullPath);
    const hash = sha256File(fullPath);
    fileIntegrities.push({
      path: file,
      hash,
      size: stats.size,
    });
  }

  const fileHashes: Record<string, string> = {};
  for (const f of fileIntegrities) {
    fileHashes[f.path] = f.hash;
  }
  const globalHash = computeGlobalHash(fileHashes);

  return {
    files: fileIntegrities,
    globalHash,
  };
}

export function verifyIntegrity(bundleDir: string, expectedGlobalHash: string): boolean {
  const integrity = computeIntegrity(bundleDir);
  return integrity.globalHash === expectedGlobalHash;
}
