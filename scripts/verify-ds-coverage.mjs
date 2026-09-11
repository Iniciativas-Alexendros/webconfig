#!/usr/bin/env node
// Verifica cobertura 1:1 del design system:
//   1. Cada token DTCG genera su custom property en dist-tokens/css/variables.css.
//   2. La copia del showcase es byte-identica al generado.
//   3. Cada componente de ds-catalog.example.yaml tiene su renderer en showcase.
// Falla (exit 1) ante cualquier descuadre.
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = false;

const tokenFiles = readdirSync(join(root, "tokens"))
  .filter((f) => f.endsWith(".tokens.json"))
  .sort();
const css = readFileSync(join(root, "dist-tokens", "css", "variables.css"), "utf-8");
const copy = readFileSync(join(root, "showcase", "src", "styles", "generated-tokens.css"), "utf-8");

function leaves(node, path, out) {
  for (const key of Object.keys(node).sort()) {
    if (key.startsWith("$")) continue;
    const child = node[key];
    if (child && typeof child === "object" && typeof child.$value === "string") out.push([...path, key].join("-"));
    else if (child && typeof child === "object") leaves(child, [...path, key], out);
  }
}

const expected = new Set();
for (const file of tokenFiles) {
  const json = JSON.parse(readFileSync(join(root, "tokens", file), "utf-8"));
  const names = [];
  leaves(json, [], names);
  for (const n of names) expected.add(`--${n}`);
}
const missing = [...expected].filter((v) => !css.includes(`${v}:`));
if (missing.length > 0) {
  console.error(`FAIL: ${missing.length} vars sin generar: ${missing.slice(0, 10).join(", ")}`);
  failed = true;
} else {
  console.log(`OK: ${expected.size} tokens -> ${expected.size} custom properties`);
}

if (css !== copy) {
  console.error("FAIL: showcase/src/styles/generated-tokens.css difiere de dist-tokens/css/variables.css");
  failed = true;
} else {
  console.log("OK: copia del showcase byte-identica");
}

const catalog = parse(readFileSync(join(root, "ds-catalog.example.yaml"), "utf-8"));
const ids = catalog.components.map((c) => c.id).sort();
const absent = [];
const noExport = [];
for (const id of ids) {
  const file = join(root, "showcase", "src", "components", `${id}.ts`);
  try {
    const src = readFileSync(file, "utf-8");
    if (!src.includes("export function render")) noExport.push(id);
  } catch {
    absent.push(id);
  }
}
if (absent.length > 0) {
  console.error(`FAIL: sin renderer: ${absent.join(", ")}`);
  failed = true;
} else {
  console.log(`OK: ${ids.length}/${ids.length} componentes del catalogo con renderer`);
}
if (noExport.length > 0) {
  console.error(`FAIL: sin export function render: ${noExport.join(", ")}`);
  failed = true;
}

console.log(`componentes: ${ids.join(", ")}`);
if (failed) process.exit(1);
console.log("Cobertura DS 1:1 verificada");
