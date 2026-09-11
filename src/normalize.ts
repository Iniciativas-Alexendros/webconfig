import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { canonicalizeFile, isCanonicalYaml, isCanonicalJson } from "./canonicalize.js";
import { walkDirSync } from "./fs-utils.js";

export async function normalizeDirectory(
  bundleDir: string,
  options: { check: boolean; write: boolean }
): Promise<{ normalized: number; errors: string[] }> {
  const absoluteDir = resolve(bundleDir);
  const files = walkDirSync(absoluteDir);
  let normalized = 0;
  const errors: string[] = [];

  for (const file of files) {
    const fullPath = join(absoluteDir, file);
    const ext = extname(file);
    if (ext !== ".yaml" && ext !== ".yml" && ext !== ".json") continue;
    const content = readFileSync(fullPath, "utf-8");

    const isCanonical = ext === ".json" ? isCanonicalJson(content) : isCanonicalYaml(content);

    if (!isCanonical) {
      if (options.check) {
        errors.push(`${file}: not canonical`);
      } else if (options.write) {
        writeFileSync(fullPath, canonicalizeFile(content, ext), "utf-8");
        normalized++;
      } else {
        errors.push(`${file}: would be normalized (use --write)`);
      }
    }
  }

  return { normalized, errors };
}
