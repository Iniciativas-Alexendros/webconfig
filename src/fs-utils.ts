import { promises as fs } from "node:fs";
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

export function walkDirSync(dir: string, base: string = dir): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDirSync(fullPath, base));
    } else if (entry.isFile()) {
      files.push(toPosix(relative(base, fullPath)));
    }
  }
  return files.sort();
}

export async function walkDir(dir: string, base: string = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath, base)));
    } else if (entry.isFile()) {
      files.push(toPosix(relative(base, fullPath)));
    }
  }
  return files.sort();
}
