import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname, relative } from "node:path";
import { canonicalizeFile, isCanonicalYaml, isCanonicalJson } from "./canonicalize.js";

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

export async function normalizeDirectory(
  bundleDir: string,
  options: { check: boolean; write: boolean }
): Promise<{ normalized: number; errors: string[] }> {
  const absoluteDir = resolve(bundleDir);
  const files = walkDir(absoluteDir);
  let normalized = 0;
  const errors: string[] = [];

  for (const file of files) {
    const fullPath = join(absoluteDir, file);
    const ext = extname(file);
    const content = readFileSync(fullPath, "utf-8");

    let isCanonical = true;
    let canonicalContent = content;

    if (ext === ".yaml" || ext === ".yml") {
      isCanonical = isCanonicalYaml(content);
      if (!isCanonical) {
        canonicalContent = canonicalizeFile(content, ext);
      }
    } else if (ext === ".json") {
      isCanonical = isCanonicalJson(content);
      if (!isCanonical) {
        canonicalContent = canonicalizeFile(content, ext);
      }
    }

    if (!isCanonical) {
      if (options.check) {
        errors.push(`${file}: not canonical`);
      } else if (options.write) {
        writeFileSync(fullPath, canonicalContent, "utf-8");
        normalized++;
      } else {
        errors.push(`${file}: would be normalized (use --write)`);
      }
    }
  }

  return { normalized, errors };
}