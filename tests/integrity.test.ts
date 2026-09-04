import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { validateBundle } from "../src/validate/index.js";

const goldenBundle = resolve("fixtures/golden/clinica-dental-sur");
const dsCatalog = resolve("ds-catalog.example.yaml");

describe("integrity validation", () => {
  it("INTEGRITY_001 fires only for the file whose hash differs", async () => {
    const result = await validateBundle({
      bundlePath: resolve("fixtures/invalid/INTEGRITY_001"),
      dsCatalogPath: dsCatalog,
    });
    const integrityErrors = result.errors.filter((e) => e.code === "INTEGRITY_001");
    expect(integrityErrors).toHaveLength(1);
    expect(integrityErrors[0]?.message).toContain("assets/brand/logo.svg");
    expect(result.errors).not.toContainEqual(expect.objectContaining({ code: "INTEGRITY_002" }));
    expect(result.valid).toBe(false);
  });

  it("INTEGRITY_002 fires on global hash mismatch without file errors", async () => {
    const result = await validateBundle({
      bundlePath: resolve("fixtures/invalid/INTEGRITY_002"),
      dsCatalogPath: dsCatalog,
    });
    const integrityErrors = result.errors.filter((e) => e.code === "INTEGRITY_002");
    expect(integrityErrors).toHaveLength(1);
    expect(result.errors).not.toContainEqual(expect.objectContaining({ code: "INTEGRITY_001" }));
    expect(result.valid).toBe(false);
  });

  it("golden bundle passes integrity validation", async () => {
    const result = await validateBundle({
      bundlePath: goldenBundle,
      dsCatalogPath: dsCatalog,
    });
    expect(result.errors.filter((e) => e.code.startsWith("INTEGRITY"))).toHaveLength(0);
  });
});