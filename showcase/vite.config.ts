import { defineConfig } from "vite";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function flatVars(obj: unknown, prefix: string, out: Record<string, string>): void {
  if (typeof obj === "string") {
    out[prefix] = obj;
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flatVars(v, prefix ? `${prefix}-${k}` : `--${k}`, out);
    }
  }
}

function loadBundleData() {
  const tokensJson = JSON.parse(readFileSync(join(root, "dist-tokens", "json", "tokens.json"), "utf-8"));
  const hexJson = JSON.parse(readFileSync(join(root, "dist-tokens", "json", "fallback-hex.json"), "utf-8"));
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  flatVars(tokensJson.light, "", light);
  flatVars(tokensJson.dark ?? tokensJson.light, "", dark);
  const golden: Record<string, string> = {};
  for (const slug of ["home", "servicios", "contacto"]) {
    golden[slug] = readFileSync(
      join(root, "fixtures", "golden", "clinica-dental-sur", "composition", `${slug}.yaml`),
      "utf-8"
    );
  }
  const invalid = readdirSync(join(root, "fixtures", "invalid"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  return { light, dark, hex: hexJson, golden, invalid };
}

export default defineConfig({
  root: join(root, "showcase"),
  base: "./",
  define: {
    __GOLDEN__: JSON.stringify(loadBundleData().golden),
    __TOKENS__: JSON.stringify({ light: loadBundleData().light, dark: loadBundleData().dark }),
    __HEX__: JSON.stringify(loadBundleData().hex),
    __INVALID__: JSON.stringify(loadBundleData().invalid),
  },
  build: {
    outDir: join(root, "dist-showcase"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
