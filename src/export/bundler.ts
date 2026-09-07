import { promises as fs } from "node:fs";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import tar from "tar-stream";
import zlib from "node:zlib";
import { walkDir } from "../fs-utils.js";

export interface ExportOptions {
  bundleDir: string;
  outputPath: string;
}

export async function exportBundle(options: ExportOptions): Promise<void> {
  const { bundleDir, outputPath } = options;
  const resolvedBundleDir = path.resolve(bundleDir);
  const resolvedOutputPath = path.resolve(outputPath);

  const pack = tar.pack();
  const gunzip = zlib.createGzip({ level: 9 });
  const writeStream = createWriteStream(resolvedOutputPath);

  const packStream = pack as unknown as NodeJS.ReadableStream;
  packStream.pipe(gunzip).pipe(writeStream);

  const relativePaths = await walkDir(resolvedBundleDir);
  relativePaths.sort((a, b) => a.localeCompare(b));
  const files: FileEntry[] = relativePaths.map((relativePath) => ({
    absolutePath: path.join(resolvedBundleDir, relativePath),
    relativePath,
  }));

  for (const file of files) {
    const stat = await fs.stat(file.absolutePath);
    const header = {
      name: file.relativePath,
      size: stat.size,
      mode: 0o644,
      mtime: new Date(0), // epoch for determinism
      uid: 0,
      gid: 0,
      uname: "",
      gname: "",
      type: "file" as const,
    };

    await new Promise<void>((resolve, reject) => {
      const sink = pack.entry(header, (err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
      const readStream = createReadStream(file.absolutePath);
      readStream.pipe(sink);
    });
  }

  return new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
    pack.finalize();
  });
}

interface FileEntry {
  absolutePath: string;
  relativePath: string;
}
