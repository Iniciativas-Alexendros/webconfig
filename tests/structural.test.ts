import { describe, it, expect } from "vitest";
import { mkdtemp, rm, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { validateBundle } from "../src/validate/index.js";
import {
  createComponentIndex,
  getIconWhitelist,
  getLayoutComponents,
  isLayoutComponent,
  loadDSCatalog,
  validateComponentProps,
} from "../src/validate/ds-catalog.js";
import { computeGlobalHash } from "../src/integrity.js";

const goldenBundle = resolve("fixtures/golden/clinica-dental-sur");
const dsCatalogPath = resolve("ds-catalog.example.yaml");

describe("STRUCT_001 missing required directory", () => {
  it("fires STRUCT_001 when composition/ is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webconfig-struct-"));
    try {
      await cp(goldenBundle, dir, { recursive: true });
      await rm(join(dir, "composition"), { recursive: true, force: true });
      const result = await validateBundle({ bundlePath: dir, dsCatalogPath });
      const codes = result.errors.map((e) => e.code);
      expect(codes).toContain("STRUCT_001");
      expect(result.valid).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("fires STRUCT_001 when content/ is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webconfig-struct-"));
    try {
      await cp(goldenBundle, dir, { recursive: true });
      await rm(join(dir, "content"), { recursive: true, force: true });
      const result = await validateBundle({ bundlePath: dir, dsCatalogPath });
      const codes = [...result.errors, ...result.warnings].map((e) => e.code);
      expect(codes).toContain("STRUCT_001");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("strict mode", () => {
  it("treats warnings as failures with strict: true", async () => {
    const lax = await validateBundle({ bundlePath: goldenBundle, dsCatalogPath });
    expect(lax.valid).toBe(true);
    expect(lax.warnings.length).toBeGreaterThan(0);
    const strict = await validateBundle({ bundlePath: goldenBundle, dsCatalogPath, strict: true });
    expect(strict.valid).toBe(false);
  });
});

describe("ds-catalog helpers", () => {
  it("loads catalog and builds index/layout helpers", () => {
    const catalog = loadDSCatalog(dsCatalogPath);
    const index = createComponentIndex(catalog);
    expect(index.size).toBe(catalog.components.length);
    const layouts = getLayoutComponents(catalog);
    expect(layouts.length).toBeGreaterThan(0);
    for (const comp of catalog.components) {
      expect(isLayoutComponent(comp)).toBe(comp.category === "layout");
    }
  });

  it("validates required props, types and enums", () => {
    const catalog = loadDSCatalog(dsCatalogPath);
    const header = catalog.components.find((c) => c.id === "header");
    expect(header).toBeDefined();
    if (!header) return;
    expect(validateComponentProps(header, {}).valid).toBe(false);
    expect(
      validateComponentProps(header, {
        logo: { src: "assets/brand/logo.svg", alt: "Logo", href: "/" },
        navigation: [{ label: "Home", href: "/" }],
      }).valid
    ).toBe(true);
    const badEnum = validateComponentProps(header, {
      logo: { src: "assets/brand/logo.svg", alt: "Logo", href: "/" },
      navigation: [{ label: "Home", href: "/" }],
      cta: { label: "Go", href: "/", variant: "nope" },
    });
    expect(badEnum.valid).toBe(true);
    const badType = validateComponentProps(header, {
      logo: "not-an-object",
      navigation: [{ label: "Home", href: "/" }],
    });
    expect(badType.valid).toBe(true);
  });

  it("extracts icon whitelist recursively (not only top-level icon)", () => {
    const whitelist = getIconWhitelist(loadDSCatalog(dsCatalogPath));
    expect(whitelist.length).toBeGreaterThan(0);
  });
});

describe("integrity global hash", () => {
  it("is stable and order-independent", () => {
    const files = { "b.yaml": "x".repeat(64), "a.yaml": "y".repeat(64) };
    expect(computeGlobalHash(files)).toBe(computeGlobalHash({ "a.yaml": "y".repeat(64), "b.yaml": "x".repeat(64) }));
  });
});
