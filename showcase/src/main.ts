import { TokensView, ComponentesView, PreviewView } from "./views/views.js";
import { ValidateView } from "./views/validate.js";
import { parseCompositionYaml } from "./lib/yaml.js";
import { renderByType } from "./lib/registry.js";
import { exampleBundleMap } from "./lib/example-bundle.js";
import { bundleMapFromRelativePaths } from "./lib/bundle-files.js";
import { validateSyntaxDocuments } from "../../src/validate/syntax-documents.js";

declare const __GOLDEN__: Record<string, string>;
declare const __TOKENS__: { light: Record<string, string>; dark: Record<string, string> };
declare const __HEX__: { light: Record<string, string>; dark: Record<string, string> };
declare const __INVALID__: string[];

const appEl = document.getElementById("app");
if (!appEl) throw new Error("Falta #app en showcase/index.html");
const app: HTMLElement = appEl;

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Modo privado: el tema no persiste pero la app sigue funcionando.
  }
}

function themeInit(): void {
  const saved = storageGet("ds-theme");
  const theme = saved === "dark" || saved === "light" ? saved : "auto";
  applyTheme(theme);
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") ?? "auto";
    const next = cur === "light" ? "dark" : cur === "dark" ? "auto" : "light";
    applyTheme(next);
  });
}

function applyTheme(theme: string): void {
  if (theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  storageSet("ds-theme", theme);
  const label = document.getElementById("theme-label");
  if (label) label.textContent = `Tema: ${theme}`;
}

function tokenRows(): Array<{ name: string; light: string; dark: string; hex: string }> {
  const names = Object.keys(__TOKENS__.light).sort();
  return names.map((n) => ({
    name: n,
    light: __TOKENS__.light[n] as string,
    dark: (__TOKENS__.dark[n] as string) ?? (__TOKENS__.light[n] as string),
    hex: (__HEX__.light[n] as string) ?? "",
  }));
}

function goldenPages(): Array<{ slug: string; html: string }> {
  return ["home", "servicios", "contacto"].map((slug) => {
    const raw = (__GOLDEN__ as Record<string, string> | undefined)?.[slug] ?? "";
    try {
      const parsed = parseCompositionYaml(raw);
      const html = parsed.components
        .map((c) => {
          try {
            return renderByType(c.type, c.props);
          } catch {
            return `<div class="badge" data-tone="danger">Error en ${c.id}</div>`;
          }
        })
        .join("\n");
      return { slug, html };
    } catch {
      return { slug, html: renderByType("text-block", { content: `No se pudo parsear ${slug}`, variant: "body" }) };
    }
  });
}

function validationModel(files: ReadonlyMap<string, string>, sourceLabel: string) {
  const issues = validateSyntaxDocuments(files).map((issue) => ({
    code: issue.code,
    severity: issue.severity,
    file: issue.file,
    message: issue.message,
  }));
  return { sourceLabel, issues };
}

function showValidation(files: ReadonlyMap<string, string>, sourceLabel: string): void {
  app.innerHTML = ValidateView(validationModel(files, sourceLabel));
  wireBundleForm();
}

function wireBundleForm(): void {
  const input = document.getElementById("bundle-files") as HTMLInputElement | null;
  input?.addEventListener("change", () => {
    const list = input.files;
    if (!list || list.length === 0) {
      showValidation(exampleBundleMap(), "ejemplo local");
      return;
    }
    void (async () => {
      const entries = await Promise.all(
        [...list].map(async (file) => {
          const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
          return { path: relative, text: await file.text() };
        })
      );
      const map = bundleMapFromRelativePaths(entries);
      const label = map.size === 0 ? "ejemplo local" : "archivos locales";
      showValidation(map.size === 0 ? exampleBundleMap() : map, label);
    })();
  });
  document.getElementById("bundle-example")?.addEventListener("click", () => {
    showValidation(exampleBundleMap(), "ejemplo local");
  });
}

function route(): void {
  const hash = location.hash || "#/";
  const previewMatch = hash.match(/^#\/preview\/([A-Za-z0-9-]+)/);
  if (hash.startsWith("#/componentes")) {
    app.innerHTML = ComponentesView();
  } else if (hash.startsWith("#/validar")) {
    showValidation(exampleBundleMap(), "ejemplo local");
  } else if (hash.startsWith("#/preview")) {
    const pages = goldenPages();
    const active = previewMatch ? (previewMatch[1] as string) : "home";
    app.innerHTML = PreviewView(pages, active, null, __INVALID__);
    wireInvalidPicker(pages, active);
  } else {
    app.innerHTML = TokensView({ vars: tokenRows() });
  }
}

function wireInvalidPicker(pages: Array<{ slug: string; html: string }>, active: string): void {
  const sel = document.getElementById("invalid-code") as HTMLSelectElement | null;
  sel?.addEventListener("change", () => {
    const code = sel.value;
    const out = document.getElementById("invalid-out");
    if (out) {
      out.innerHTML = `El fixture <code>${code.replace(/[^A-Z0-9_]/g, "")}</code> dispara ese código en <code>webconfig validate</code>.`;
    }
    sel.focus();
    void pages;
    void active;
  });
}

window.addEventListener("hashchange", route);
themeInit();
route();
