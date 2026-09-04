import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { validateBundle } from "../src/validate/index.js";

const goldenBundle = resolve("fixtures/golden/clinica-dental-sur");
const dsCatalog = resolve("ds-catalog.example.yaml");

async function makeTempCopy(): Promise<string> {
  const dir = await fs.mkdtemp(join(tmpdir(), "webconfig-manifest-"));
  await fs.cp(goldenBundle, dir, { recursive: true });
  return dir;
}

describe("manifest schema_compat compliance", () => {
  it("manifest without schema_compat fires MANIFEST_001 (required field), not MANIFEST_002", async () => {
    const dir = await makeTempCopy();
    try {
      const manifestPath = join(dir, "manifest.yaml");
      const manifest = await fs.readFile(manifestPath, "utf-8");
      const stripped = manifest
        .split("\n")
        .filter((line) => !line.startsWith("schema_compat:"))
        .join("\n");
      await fs.writeFile(manifestPath, stripped);

      const result = await validateBundle({ bundlePath: dir, dsCatalogPath: dsCatalog });
      const codes = result.errors.map((e) => e.code);
      expect(codes).toContain("MANIFEST_001");
      expect(codes).not.toContain("MANIFEST_002");
      expect(result.valid).toBe(false);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("MANIFEST_002 fixture with schema_compat 2.4.1 fires MANIFEST_002", async () => {
    const result = await validateBundle({
      bundlePath: resolve("fixtures/invalid/MANIFEST_002"),
      dsCatalogPath: dsCatalog,
    });
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain("MANIFEST_002");
    expect(codes).not.toContain("MANIFEST_001");
    const manifestErrors = result.errors.filter((e) => e.code === "MANIFEST_002");
    expect(manifestErrors.some((e) => e.message.includes("schema_compat"))).toBe(true);
    expect(result.valid).toBe(false);
  });

  it("golden bundle passes with schema_compat ^1.0.0", async () => {
    const result = await validateBundle({ bundlePath: goldenBundle, dsCatalogPath: dsCatalog });
    expect(result.errors).toHaveLength(0);
  });
});