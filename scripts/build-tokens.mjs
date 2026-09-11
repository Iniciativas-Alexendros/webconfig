#!/usr/bin/env node
// Constructor de tokens DTCG sin dependencias externas.
// Lee tokens/*.tokens.json (formato W3C DTCG, color en OKLCH) y genera:
//   dist-tokens/css/variables.css  (custom properties + dark + fallback hex)
//   dist-tokens/ts/tokens.ts        (mapas tipados light/dark)
//   dist-tokens/json/tokens.json    (valores resueltos por modo)
//   dist-tokens/json/fallback-hex.json (hex sRGB por variable y modo)
//   showcase/src/styles/generated-tokens.css (copia byte-identica para Vite)
// Determinista: claves ordenadas, LF, indentacion 2 espacios.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_DIR = join(root, "tokens");
const OUT_CSS = join(root, "dist-tokens", "css", "variables.css");
const OUT_TS = join(root, "dist-tokens", "ts", "tokens.ts");
const OUT_JSON = join(root, "dist-tokens", "json", "tokens.json");
const OUT_HEX = join(root, "dist-tokens", "json", "fallback-hex.json");
const SHOWCASE_COPY = join(root, "showcase", "src", "styles", "generated-tokens.css");

function parseOklch(input) {
  const m = String(input)
    .trim()
    .match(/^oklch\(\s*([0-9.]+%?)\s+(-?[0-9.]+)\s+(-?[0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)$/i);
  if (!m) throw new Error(`OKLCH invalido: ${input}`);
  const num = (v) => (v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v));
  return { l: num(m[1]), c: parseFloat(m[2]), h: parseFloat(m[3]), a: m[4] === undefined ? 1 : num(m[4]) };
}

function oklchToRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  return {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  };
}

function linearToSrgb(c) {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

export function oklchToHex(input) {
  const { r, g, b } = oklchToRgb(parseOklch(input));
  const hx = (c) =>
    Math.round(linearToSrgb(c) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hx(r)}${hx(g)}${hx(b)}`.toLowerCase();
}

function isLeaf(node) {
  return !!node && typeof node === "object" && !Array.isArray(node) && typeof node.$value === "string";
}

function collectLeaves(node, path, out) {
  for (const key of Object.keys(node).sort()) {
    if (key.startsWith("$")) continue;
    const child = node[key];
    if (isLeaf(child)) out.push({ path: [...path, key], node: child });
    else if (child && typeof child === "object") collectLeaves(child, [...path, key], out);
  }
}

function buildIndex(files) {
  const index = new Map();
  for (const file of files) {
    const json = JSON.parse(readFileSync(join(TOKENS_DIR, file), "utf-8"));
    const leaves = [];
    collectLeaves(json, [], leaves);
    for (const leaf of leaves) {
      const key = leaf.path.join(".");
      if (index.has(key)) throw new Error(`Token duplicado: ${key} (en ${file})`);
      index.set(key, { ...leaf, file });
    }
  }
  return index;
}

function resolveValue(raw, index, stack = []) {
  return String(raw).replace(/\{([a-z0-9._-]+)\}/gi, (_m, ref) => {
    if (stack.includes(ref)) throw new Error(`Referencia circular: ${[...stack, ref].join(" -> ")}`);
    const target = index.get(ref);
    if (!target) throw new Error(`Referencia sin resolver: {${ref}}`);
    return resolveValue(target.node.$value, index, [...stack, ref]);
  });
}

function varName(path) {
  return `--${path.join("-")}`;
}

function setNested(obj, path, value) {
  let cur = obj;
  for (const key of path.slice(0, -1)) cur = cur[key] ?? (cur[key] = {});
  cur[path[path.length - 1]] = value;
}

const files = readdirSync(TOKENS_DIR)
  .filter((f) => f.endsWith(".tokens.json"))
  .sort();
if (files.length === 0) throw new Error("Sin ficheros tokens/*.tokens.json");
const index = buildIndex(files);

const light = new Map();
const dark = new Map();
for (const [key, leaf] of [...index.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
  const modes = leaf.node.$extensions?.mode;
  const lightRaw = modes?.light ?? leaf.node.$value;
  const darkRaw = modes?.dark ?? lightRaw;
  light.set(key, resolveValue(lightRaw, index, [key]));
  dark.set(key, resolveValue(darkRaw, index, [key]));
}

const names = [...light.keys()].sort();
const varOf = new Map(names.map((k) => [k, varName(k.split("."))]));

const lightDecls = [];
const darkDecls = [];
const fallbackDecls = [];
const hexLight = {};
const hexDark = {};
for (const key of names) {
  const v = varOf.get(key);
  lightDecls.push(`  ${v}: ${light.get(key)};`);
  if (dark.get(key) !== light.get(key)) darkDecls.push(`  ${v}: ${dark.get(key)};`);
  for (const [mode, store, hexStore] of [
    ["light", light, hexLight],
    ["dark", dark, hexDark],
  ]) {
    const val = store.get(key);
    if (val.startsWith("oklch(")) {
      hexStore[v] = oklchToHex(val);
      if (mode === "light") fallbackDecls.push(`  ${v}: ${hexStore[v]}; /* fallback ${val} */`);
    }
  }
  void dark;
}

const css =
  "@layer tokens {\n  :root {\n    color-scheme: light dark;\n" +
  lightDecls.join("\n") +
  '\n  }\n  :root[data-theme="dark"] {\n' +
  darkDecls.join("\n") +
  "\n  }\n  @supports not (color: oklch(0% 0 0)) {\n    :root {\n" +
  fallbackDecls.join("\n") +
  "\n    }\n  }\n}\n";
// prettier-ignore

const nestedLight = {};
const nestedDark = {};
for (const key of names) {
  setNested(nestedLight, key.split("."), light.get(key));
  setNested(nestedDark, key.split("."), dark.get(key));
}
const jsonOut =
  JSON.stringify(
    { $meta: { ds: "webconfig", modes: ["light", "dark"] }, light: nestedLight, dark: nestedDark },
    null,
    2
  ) + "\n";
const hexOut = JSON.stringify({ light: hexLight, dark: hexDark }, null, 2) + "\n";

const tsOut = `// Generado por scripts/build-tokens.mjs. No editar a mano.
export const tokenVars = [${names.map((k) => JSON.stringify(varOf.get(k))).join(", ")}] as const;
export type TokenVar = (typeof tokenVars)[number];
export const lightTokens: Record<TokenVar, string> = ${JSON.stringify(Object.fromEntries(names.map((k) => [varOf.get(k), light.get(k)])), null, 2)};
export const darkTokens: Record<TokenVar, string> = ${JSON.stringify(Object.fromEntries(names.map((k) => [varOf.get(k), dark.get(k)])), null, 2)};
export const fallbackHex: { light: Record<string, string>; dark: Record<string, string> } = ${hexOut.trimEnd()};
`;

for (const f of [OUT_CSS, OUT_TS, OUT_JSON, OUT_HEX, SHOWCASE_COPY]) mkdirSync(dirname(f), { recursive: true });
writeFileSync(OUT_CSS, css);
writeFileSync(SHOWCASE_COPY, css);
writeFileSync(OUT_TS, tsOut);
writeFileSync(OUT_JSON, jsonOut);
writeFileSync(OUT_HEX, hexOut);

const hash = createHash("sha256").update(css).digest("hex").slice(0, 12);
console.log(
  `tokens: ${names.length} vars desde ${files.length} ficheros (dark overrides: ${darkDecls.length}, fallbacks hex: ${fallbackDecls.length})`
);
console.log(`css sha: ${hash}`);
