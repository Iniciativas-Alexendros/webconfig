import { promises as fs } from "node:fs";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tar from "tar-stream";
import zlib from "node:zlib";

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
    const tmpDir = await fs.mkdtemp(path.join(path.dirname(resolvedPath), "webconfig-"));

    return new Promise((resolve, reject) => {
      const extract = tar.extract();
      const gunzip = zlib.createGunzip();
      const readStream = createReadStream(resolvedPath);

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
        resolve({
          bundleDir: tmpDir,
          isTemp: true,
          cleanup: async () => {
            try {
              await fs.rm(tmpDir, { recursive: true, force: true });
            } catch {
            }
          },
        });
      });

      extract.on("error", reject);
    });
  }

  throw new Error(`Unsupported bundle format: ${bundlePath}. Must be a directory or .tar.gz file.`);
}