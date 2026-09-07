import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateBundle } from "../src/validate/index.js";

const fixturesDir = resolve("fixtures/invalid");
const dsCatalog = resolve("ds-catalog.example.yaml");

const fixtures = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const structuralCodes = new Set(["STRUCT_001"]);

function errorCodesFromSource(): string[] {
  const src = readFileSync(resolve("src/validate/errors.ts"), "utf8");
  const block = src.match(/export const ErrorCode = \{([\s\S]*?)\} as const;/);
  if (!block) throw new Error("Could not locate ErrorCode const");
  const codes: string[] = [];
  for (const line of block[1].split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+):\s*"/);
    if (m) codes.push(m[1]);
  }
  return codes;
}

describe("fixture regression", () => {
  it("every non-structural error code has an invalid fixture and vice versa", () => {
    const codes = errorCodesFromSource();
    const fixtureBackedCodes = codes.filter((c) => !structuralCodes.has(c));
    expect([...fixtureBackedCodes].sort()).toEqual(fixtures);
  });

  it.each(fixtures)("%s triggers its own code", async (fixture) => {
    const result = await validateBundle({
      bundlePath: join(fixturesDir, fixture),
      dsCatalogPath: dsCatalog,
    });
    const all = [...result.errors, ...result.warnings];
    const codes = all.map((i) => i.code);
    expect(codes).toContain(fixture);
  });
});