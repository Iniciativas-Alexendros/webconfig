import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
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

const data = loadBundleData();

const rootToShowcase: Plugin = {
  name: "webconfig-root-to-showcase",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (!req.url) return next();
      const pathOnly = req.url.split("?")[0] ?? "";
      if (pathOnly === "/" || pathOnly === "/index.html") {
        const qs = req.url.includes("?") ? `?${req.url.split("?")[1]}` : "";
        req.url = `/showcase/index.html${qs}`;
      }
      next();
    });
  },
};

export default defineConfig({
  root,
  base: "./",
  plugins: [react(), tailwindcss(), rootToShowcase],
  resolve: {
    alias: {
      "@": join(root, "showcase/src"),
    },
  },
  define: {
    __GOLDEN__: JSON.stringify(data.golden),
    __TOKENS__: JSON.stringify({ light: data.light, dark: data.dark }),
    __HEX__: JSON.stringify(data.hex),
    __INVALID__: JSON.stringify(data.invalid),
  },
  build: {
    outDir: join(root, "dist-showcase"),
    emptyOutDir: true,
    target: "es2022",
    rollupOptions: {
      input: {
        showcase: join(root, "showcase/index.html"),
        landing: join(root, "landing/index.html"),
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [root],
    },
  },
  preview: {
    port: 4173,
  },
});
