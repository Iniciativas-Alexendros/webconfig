import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const TOKENS_DIR = resolve("tokens");

function collectLeaves(
  node: unknown,
  path: string[],
  out: Array<{ key: string; node: Record<string, unknown> }>
): void {
  if (!node || typeof node !== "object" || Array.isArray(node)) return;
  for (const key of Object.keys(node as Record<string, unknown>)) {
    if (key.startsWith("$")) continue;
    const child = (node as Record<string, unknown>)[key] as Record<string, unknown>;
    if (child && typeof child === "object" && typeof child.$value === "string") {
      out.push({ key: [...path, key].join("."), node: child });
    } else if (child && typeof child === "object") {
      collectLeaves(child, [...path, key], out);
    }
  }
}

function oklchValid(value: string): boolean {
  const m = value.match(/^oklch\(\s*([0-9.]+%?)\s+(-?[0-9.]+)\s+(-?[0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)$/i);
  if (!m) return false;
  const num = (v: string): number => (v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v));
  const l = num(m[1] as string);
  const c = parseFloat(m[2] as string);
  const h = parseFloat(m[3] as string);
  if (!(l >= 0 && l <= 1)) return false;
  if (!(c >= 0 && c <= 0.5)) return false;
  if (!(h >= 0 && h <= 360)) return false;
  if (m[4] !== undefined) {
    const a = num(m[4] as string);
    if (!(a >= 0 && a <= 1)) return false;
  }
  return true;
}

describe("tokens DTCG", () => {
  const files = readdirSync(TOKENS_DIR)
    .filter((f) => f.endsWith(".tokens.json"))
    .sort();

  it("existen los 5 ficheros de tokens", () => {
    expect(files).toEqual([
      "component.button.tokens.json",
      "primitive.color.tokens.json",
      "primitive.dimension.tokens.json",
      "semantic.color.tokens.json",
      "semantic.typography.tokens.json",
    ]);
  });

  it("parse DTCG: todo leaf tiene $value string y $type", () => {
    for (const file of files) {
      const json = JSON.parse(readFileSync(join(TOKENS_DIR, file), "utf-8")) as unknown;
      const leaves: Array<{ key: string; node: Record<string, unknown> }> = [];
      collectLeaves(json, [], leaves);
      expect(leaves.length).toBeGreaterThan(0);
      for (const leaf of leaves) {
        expect(typeof leaf.node.$value, `${file}:${leaf.key} $value`).toBe("string");
        expect(typeof leaf.node.$type, `${file}:${leaf.key} $type`).toBe("string");
      }
    }
  });

  it("sin claves duplicadas entre ficheros", () => {
    const seen = new Set<string>();
    for (const file of files) {
      const json = JSON.parse(readFileSync(join(TOKENS_DIR, file), "utf-8")) as unknown;
      const leaves: Array<{ key: string; node: Record<string, unknown> }> = [];
      collectLeaves(json, [], leaves);
      for (const leaf of leaves) {
        expect(seen.has(leaf.key), `duplicado: ${leaf.key}`).toBe(false);
        seen.add(leaf.key);
      }
    }
  });

  it("colores OKLCH con rangos validos", () => {
    for (const file of files) {
      const json = JSON.parse(readFileSync(join(TOKENS_DIR, file), "utf-8")) as unknown;
      const leaves: Array<{ key: string; node: Record<string, unknown> }> = [];
      collectLeaves(json, [], leaves);
      for (const leaf of leaves) {
        const value = String(leaf.node.$value);
        if (value.startsWith("oklch(")) {
          expect(oklchValid(value), `${file}:${leaf.key} = ${value}`).toBe(true);
        }
      }
    }
  });

  it("referencias {grupo.token} resuelven a claves existentes", () => {
    const keys = new Set<string>();
    const raws = new Map<string, string>();
    for (const file of files) {
      const json = JSON.parse(readFileSync(join(TOKENS_DIR, file), "utf-8")) as unknown;
      const leaves: Array<{ key: string; node: Record<string, unknown> }> = [];
      collectLeaves(json, [], leaves);
      for (const leaf of leaves) {
        keys.add(leaf.key);
        raws.set(leaf.key, String(leaf.node.$value));
      }
    }
    for (const [key, raw] of raws) {
      for (const match of raw.matchAll(/\{([a-z0-9._-]+)\}/gi)) {
        expect(keys.has(match[1] as string), `${key} referencia {${match[1]}} inexistente`).toBe(true);
      }
    }
  });

  it("tokens generados existen y cubren 1:1 las custom properties", () => {
    try {
      execFileSync("node", ["scripts/build-tokens.mjs"], { stdio: "ignore", timeout: 30000 });
    } catch {
      // Si el build falla, los readFileSync siguientes dan el error real.
    }
    const css = readFileSync(resolve("dist-tokens/css/variables.css"), "utf-8");
    const tokensJson = JSON.parse(readFileSync(resolve("dist-tokens/json/tokens.json"), "utf-8")) as {
      light: unknown;
    };
    const flat: string[] = [];
    const walk = (node: unknown, path: string[]): void => {
      if (!node || typeof node !== "object") return;
      for (const k of Object.keys(node as Record<string, unknown>)) {
        const child = (node as Record<string, unknown>)[k];
        if (typeof child === "string") flat.push(`--${[...path, k].join("-")}`);
        else walk(child, [...path, k]);
      }
    };
    walk(tokensJson.light, []);
    expect(flat.length).toBeGreaterThan(100);
    for (const v of flat) {
      expect(css.includes(`${v}:`), `var ausente en CSS: ${v}`).toBe(true);
    }
  });
});
