import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { createGzip } from "node:zlib";
import { pack } from "tar-stream";
import { pipeline } from "node:stream/promises";

const execFileAsync = promisify(execFile);
const cliPath = resolve("dist/cli.js");

async function createTarGz(entries: Array<{ name: string; content: string }>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "webconfig-test-"));
  const tarPath = join(dir, "test.tar.gz");
  const packer = pack();
  for (const e of entries) {
    packer.entry({ name: e.name, size: Buffer.byteLength(e.content) }, e.content);
  }
  packer.finalize();
  await pipeline(packer, createGzip(), createWriteStream(tarPath));
  return tarPath;
}

describe("integration tests", () => {
  const goldenBundle = resolve("fixtures/golden/clinica-dental-sur");
  const dsCatalog = resolve("ds-catalog.example.yaml");

  it("validate command works via CLI", async () => {
    const { stdout, stderr } = await execFileAsync("node", [cliPath, "validate", goldenBundle, "--ds", dsCatalog]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Valid bundle");
  });

  it("validate command with --json outputs valid JSON", async () => {
    const { stdout, stderr } = await execFileAsync("node", [
      cliPath,
      "validate",
      goldenBundle,
      "--ds",
      dsCatalog,
      "--json",
    ]);
    expect(stderr).toBe("");
    const result = JSON.parse(stdout);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    // Golden is intentionally partial in 'en' (falls back to es) -> I18N_002 warnings
    expect(result.warnings.length).toBeGreaterThan(0);
    for (const w of result.warnings) {
      expect(w.code).toBe("I18N_002");
    }
  });

  it("export command works via CLI", async () => {
    const { stdout, stderr } = await execFileAsync("node", [
      cliPath,
      "export",
      "fixtures/golden/clinica-dental-sur",
      "/tmp/integration-test.tar.gz",
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Exported to");
  });

  it("validate works on exported tar.gz", async () => {
    const { stdout, stderr } = await execFileAsync("node", [
      cliPath,
      "validate",
      "/tmp/integration-test.tar.gz",
      "--ds",
      dsCatalog,
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Valid bundle");
  });

  it("does not echo detected secrets in validate output (SECRET_001)", async () => {
    let stdout = "";
    try {
      await execFileAsync("node", [cliPath, "validate", "fixtures/invalid/SECRET_001", "--ds", dsCatalog]);
      expect.unreachable("expected validate to fail");
    } catch (err) {
      const e = err as { code?: number; stdout?: string };
      expect(e.code).toBe(1);
      stdout = e.stdout ?? "";
    }
    expect(stdout).toContain("SECRET_001");
    expect(stdout).toContain("possible AWS access key detected");
    expect(stdout).not.toContain("AKIA1234567890123456");
  });

  it("does not echo detected credentials in validate output (CRYPTO_001)", async () => {
    const { stdout, stderr } = await execFileAsync("node", [
      cliPath,
      "validate",
      "fixtures/invalid/CRYPTO_001",
      "--ds",
      dsCatalog,
    ]);
    expect(stderr).toBe("");
    expect(stdout).toContain("CRYPTO_001");
    expect(stdout).not.toContain("secret123");
    expect(stdout).not.toContain("api_key = secret123");
  });

  it("validate --json is fail-closed on parse errors (exit 1, valid JSON)", async () => {
    try {
      await execFileAsync("node", [cliPath, "validate", resolve("does-not-exist"), "--ds", dsCatalog, "--json"]);
      expect.unreachable("expected validate to fail");
    } catch (err) {
      const e = err as { code?: number; stdout?: string };
      expect(e.code).toBe(1);
      const result = JSON.parse(e.stdout ?? "");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.severity).toBe("error");
    }
  });

  it("rejects tar entries that escape the bundle directory (tar-slip)", async () => {
    const tarPath = await createTarGz([{ name: "../../../../etc/evil.txt", content: "pwned" }]);
    try {
      await execFileAsync("node", [cliPath, "validate", tarPath, "--ds", dsCatalog]);
      expect.unreachable("expected validate to fail");
    } catch (err) {
      const e = err as { code?: number; stdout?: string };
      expect(e.code).toBe(1);
      expect(e.stdout ?? "").toContain("escapes bundle directory");
    }
  });

  it("fails with exit 1 on corrupted gzip (no crash)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webconfig-test-"));
    const tarPath = join(dir, "corrupt.tar.gz");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(tarPath, Buffer.from("not-a-valid-gzip-archive"));
    try {
      await execFileAsync("node", [cliPath, "validate", tarPath, "--ds", dsCatalog]);
      expect.unreachable("expected validate to fail");
    } catch (err) {
      const e = err as { code?: number; stdout?: string };
      expect(e.code).toBe(1);
      expect(e.stdout ?? "").toContain("failed to decompress");
    }
  });

  it("detects secrets in manifest.yaml and site.config.yaml", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webconfig-test-"));
    await cp(goldenBundle, join(dir, "bundle"), { recursive: true });
    const siteConfigPath = join(dir, "bundle", "site.config.yaml");
    const siteConfig = await readFile(siteConfigPath, "utf-8");
    await writeFile(siteConfigPath, `${siteConfig}api_token: ghp_123456789012345678901234567890123456\n`);
    try {
      await execFileAsync("node", [cliPath, "validate", join(dir, "bundle"), "--ds", dsCatalog]);
      expect.unreachable("expected validate to fail");
    } catch (err) {
      const e = err as { code?: number; stdout?: string };
      expect(e.code).toBe(1);
      const out = e.stdout ?? "";
      expect(out).toContain("possible GitHub token detected");
      expect(out).toContain("site.config.yaml");
      expect(out).not.toContain("ghp_123456789012345678901234567890123456");
    }
  });
});
