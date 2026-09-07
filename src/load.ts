import { promises as fs } from "node:fs";
import path from "node:path";
import { extractTar } from "./tar.js";

export interface LoadedBundle {
  bundleDir: string;
  isTemp: boolean;
  cleanup: () => Promise<void>;
}

export async function loadBundle(bundlePath: string): Promise<LoadedBundle> {
  const resolvedPath = path.resolve(bundlePath);
  const stat = await fs.stat(resolvedPath);

  if (stat.isDirectory()) {
    return {
      bundleDir: resolvedPath,
      isTemp: false,
      cleanup: async () => {},
    };
  }

  if (resolvedPath.endsWith(".tar.gz") || resolvedPath.endsWith(".tgz")) {
    const { dir, cleanup } = await extractTar(resolvedPath);
    return {
      bundleDir: dir,
      isTemp: true,
      cleanup,
    };
  }

  throw new Error(`Unsupported bundle format: ${bundlePath}. Must be a directory or .tar.gz file.`);
}
