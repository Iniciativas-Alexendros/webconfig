import { TokensView, ComponentesView, PreviewView } from "./views/views.js";
import { parseCompositionYaml } from "./lib/yaml.js";
import { renderByType } from "./lib/registry.js";

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

function route(): void {
  const hash = location.hash || "#/";
  const previewMatch = hash.match(/^#\/preview\/([A-Za-z0-9-]+)/);
  if (hash.startsWith("#/componentes")) {
    app.innerHTML = ComponentesView();
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
