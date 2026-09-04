import { describe, it, expect } from "vitest";
import { exportBundle } from "../src/export/bundler.js";
import { loadBundle } from "../src/load.js";
import { validateBundle } from "../src/validate/index.js";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

describe("export and round-trip", () => {
  const goldenBundle = resolve("fixtures/golden/clinica-dental-sur");
  const dsCatalog = resolve("ds-catalog.example.yaml");

  it("exports golden bundle to deterministic tar.gz", async () => {
    const output1 = resolve(tmpdir(), `test-${randomUUID()}.tar.gz`);
    const output2 = resolve(tmpdir(), `test-${randomUUID()}.tar.gz`);

    await exportBundle({ bundleDir: goldenBundle, outputPath: output1 });
    await exportBundle({ bundleDir: goldenBundle, outputPath: output2 });

    const hash1 = (await fs.readFile(output1)).toString("hex");
    const hash2 = (await fs.readFile(output2)).toString("hex");

    expect(hash1).toBe(hash2);

    await fs.rm(output1, { force: true });
    await fs.rm(output2, { force: true });
  });

  it("round-trip: validate(export(golden)) passes", async () => {
    const output = resolve(tmpdir(), `roundtrip-${randomUUID()}.tar.gz`);
    await exportBundle({ bundleDir: goldenBundle, outputPath: output });

    const result = await validateBundle({
      bundlePath: output,
      dsCatalogPath: dsCatalog,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    // Round-trip preserves golden warnings (I18N_002 for partial 'en' fallback)
    expect(result.warnings.every((w) => w.code === "I18N_002")).toBe(true);

    await fs.rm(output, { force: true });
  });

  it("loads bundle from directory and tar.gz", async () => {
    const dirLoaded = await loadBundle(goldenBundle);
    expect(dirLoaded.isTemp).toBe(false);
    expect(dirLoaded.bundleDir).toBe(goldenBundle);
    await dirLoaded.cleanup();

    const output = resolve(tmpdir(), `load-test-${randomUUID()}.tar.gz`);
    await exportBundle({ bundleDir: goldenBundle, outputPath: output });

    const tarLoaded = await loadBundle(output);
    expect(tarLoaded.isTemp).toBe(true);
    expect(tarLoaded.bundleDir).toContain("webconfig-");
    await tarLoaded.cleanup();

    await fs.rm(output, { force: true });
  });

  it("I18N_002 fires per missing content key resolved via fallback", async () => {
    const result = await validateBundle({
      bundlePath: resolve("fixtures/invalid/I18N_002"),
      dsCatalogPath: dsCatalog,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    const homeWarnings = result.warnings.filter((w) => w.file === "content/en/home.json" && w.code === "I18N_002");
    expect(homeWarnings.length).toBeGreaterThan(0);
    expect(homeWarnings[0]?.message).toContain("resolved via fallback to es");
  });

  it("I18N_002 fires per missing SEO field resolved via fallback", async () => {
    const result = await validateBundle({
      bundlePath: resolve("fixtures/invalid/I18N_002"),
      dsCatalogPath: dsCatalog,
    });
    const seoWarnings = result.warnings.filter((w) => w.file === "content/seo/en/home.yaml" && w.code === "I18N_002");
    expect(seoWarnings.length).toBeGreaterThan(0);
    expect(seoWarnings[0]?.message).toContain("#/");
  });
});