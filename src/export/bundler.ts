import { promises as fs, createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import tar from "tar-stream";
import zlib from "node:zlib";
import { walkDir } from "../fs-utils.js";

export interface ExportOptions {
  bundleDir: string;
  outputPath: string;
}

interface FileEntry {
  absolutePath: string;
  relativePath: string;
}

export async function exportBundle(options: ExportOptions): Promise<void> {
  const { bundleDir, outputPath } = options;
  const resolvedBundleDir = path.resolve(bundleDir);
  const resolvedOutputPath = path.resolve(outputPath);

  await fs.mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  const tmpOutputPath = `${resolvedOutputPath}.tmp-${process.pid}`;

  const pack = tar.pack();
  const gzip = zlib.createGzip({ level: 9 });
  const writeStream = createWriteStream(tmpOutputPath);

  const packStream = pack as unknown as NodeJS.ReadableStream;
  packStream.pipe(gzip).pipe(writeStream);

  try {
    const relativePaths = await walkDir(resolvedBundleDir);
    const files: FileEntry[] = relativePaths.map((relativePath) => ({
      absolutePath: path.join(resolvedBundleDir, relativePath),
      relativePath,
    }));

    for (const file of files) {
      if (path.resolve(file.absolutePath) === resolvedOutputPath) continue;
      const stat = await fs.stat(file.absolutePath);
      const header = {
        name: file.relativePath,
        size: stat.size,
        mode: 0o644,
        mtime: new Date(0),
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
        sink.on("error", reject);
        const readStream = createReadStream(file.absolutePath);
        readStream.on("error", reject);
        readStream.pipe(sink);
      });
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.on("close", () => resolve());
      writeStream.on("error", reject);
      packStream.on("error", reject);
      gzip.on("error", reject);
      pack.finalize();
    });

    await fs.rename(tmpOutputPath, resolvedOutputPath);
  } catch (err) {
    await fs.rm(tmpOutputPath, { force: true });
    throw err;
  }
}
