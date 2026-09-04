import { promises as fs } from "node:fs";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import tar from "tar-stream";
import zlib from "node:zlib";

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

  const files = await collectFiles(resolvedBundleDir);
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  for (const file of files) {
    const stat = await fs.stat(file.absolutePath);
    const header = {
      name: file.relativePath,
      size: stat.size,
      mode: stat.mode,
      mtime: new Date(0), // epoch for determinism
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

async function collectFiles(dir: string, baseDir: string = dir): Promise<FileEntry[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: FileEntry[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, absolutePath);

    if (entry.isDirectory()) {
      const subFiles = await collectFiles(absolutePath, baseDir);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push({ absolutePath, relativePath });
    }
  }

  return files;
}