import { TokensView, ComponentesView, PreviewView } from "./views/views.js";
import { parseCompositionYaml } from "./lib/yaml.js";
import { renderByType } from "./lib/registry.js";

declare const __GOLDEN__: Record<string, string>;
declare const __TOKENS__: { light: Record<string, string>; dark: Record<string, string> };
declare const __HEX__: { light: Record<string, string>; dark: Record<string, string> };
declare const __INVALID__: string[];

const app = document.getElementById("app") as HTMLElement;

function themeInit(): void {
  const saved = localStorage.getItem("ds-theme");
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
  localStorage.setItem("ds-theme", theme);
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
    const raw = __GOLDEN__[slug] ?? "";
    try {
      const parsed = parseCompositionYaml(raw);
      const html = parsed.components.map((c) => renderByType(c.type, c.props)).join("\n");
      return { slug, html };
    } catch {
      return { slug, html: renderByType("text-block", { content: `No se pudo parsear ${slug}`, variant: "body" }) };
    }
  });
}

function route(): void {
  const hash = location.hash || "#/";
  const previewMatch = hash.match(/^#\/preview\/([a-z-]+)/);
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
  const out = document.getElementById("invalid-out");
  sel?.addEventListener("change", () => {
    const code = sel.value;
    app.innerHTML = PreviewView(pages, active, code, __INVALID__);
    wireInvalidPicker(pages, active);
    void out;
  });
}

window.addEventListener("hashchange", route);
themeInit();
route();
