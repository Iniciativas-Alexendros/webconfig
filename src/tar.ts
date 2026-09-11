import { promises as fs, createReadStream, createWriteStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import tar from "tar-stream";
import zlib from "node:zlib";
import { TAR_LIMITS } from "./constants.js";

export class TarExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TarExtractionError";
  }
}

function safeJoin(rootDir: string, entryName: string): string {
  if (path.isAbsolute(entryName)) {
    throw new TarExtractionError(`tar entry has absolute path: ${entryName}`);
  }
  const normalized = entryName.split(/[\\/]+/).join("/");
  const resolved = path.resolve(rootDir, normalized);
  const root = path.resolve(rootDir);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new TarExtractionError(`tar entry escapes bundle directory: ${entryName}`);
  }
  return resolved;
}

export interface ExtractedBundle {
  dir: string;
  cleanup: () => Promise<void>;
}

export async function extractTar(tarPath: string): Promise<ExtractedBundle> {
  const resolvedTarPath = path.resolve(tarPath);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "webconfig-"));

  let extracted = false;
  let fileCount = 0;
  let totalBytes = 0;

  return new Promise<ExtractedBundle>((resolve, reject) => {
    const extract = tar.extract();
    const gunzip = zlib.createGunzip();
    const readStream = createReadStream(resolvedTarPath);
    let settled = false;

    const cleanup = async (): Promise<void> => {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {}
    };

    const fail = (err: Error): void => {
      if (settled) return;
      settled = true;
      void cleanup().then(() => reject(err));
    };

    readStream.on("error", (err) => fail(new TarExtractionError(`failed to read archive: ${err.message}`)));
    gunzip.on("error", (err) => fail(new TarExtractionError(`failed to decompress archive: ${err.message}`)));
    extract.on("error", (err) => fail(new TarExtractionError(`failed to extract archive: ${err.message}`)));

    extract.on(
      "entry",
      (header: { name: string; type?: string; size?: number }, stream: NodeJS.ReadableStream, next: () => void) => {
        if (
          header.type === "directory" ||
          header.type === "symlink" ||
          header.type === "link" ||
          header.type === "block-device" ||
          header.type === "character-device" ||
          header.type === "fifo"
        ) {
          if (header.type !== "directory") {
            fail(new TarExtractionError(`unsupported tar entry type: ${header.name}`));
            return;
          }
          stream.resume();
          next();
          return;
        }

        fileCount += 1;
        if (fileCount > TAR_LIMITS.maxFiles) {
          fail(new TarExtractionError(`archive exceeds max file count (${TAR_LIMITS.maxFiles})`));
          return;
        }
        totalBytes += header.size ?? 0;
        if (totalBytes > TAR_LIMITS.maxTotalBytes) {
          fail(new TarExtractionError(`archive exceeds max total size (${TAR_LIMITS.maxTotalBytes} bytes)`));
          return;
        }

        let filePath: string;
        try {
          filePath = safeJoin(tmpDir, header.name);
        } catch (err) {
          fail(err as Error);
          return;
        }

        void (async () => {
          try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            const writeStream = createWriteStream(filePath, { flags: "wx" });
            stream.on("data", (chunk: unknown) => {
              totalBytes += (chunk as Buffer).length;
              if (totalBytes > TAR_LIMITS.maxTotalBytes) {
                fail(new TarExtractionError(`archive exceeds max total size (${TAR_LIMITS.maxTotalBytes} bytes)`));
                (stream as unknown as { destroy: () => void }).destroy();
              }
            });
            writeStream.on("error", (err) =>
              fail(new TarExtractionError(`failed to write entry ${header.name}: ${err.message}`))
            );
            stream.pipe(writeStream);
            stream.on("error", (err) =>
              fail(new TarExtractionError(`failed to read entry ${header.name}: ${err.message}`))
            );
            writeStream.on("finish", () => next());
          } catch (err) {
            fail(err as Error);
          }
        })();
      }
    );

    extract.on("finish", () => {
      if (extracted || settled) return;
      extracted = true;
      settled = true;
      resolve({
        dir: tmpDir,
        cleanup,
      });
    });

    readStream.pipe(gunzip).pipe(extract as unknown as NodeJS.WritableStream);
  });
}
