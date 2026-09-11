import { describe, it, expect } from "vitest";
import { TokensView, ComponentesView, PreviewView } from "../../showcase/src/views/views.js";

describe("vistas del showcase", () => {
  it("TokensView renderiza tabla con vars", () => {
    const html = TokensView({
      vars: [{ name: "--bg-base", light: "oklch(1 0 0)", dark: "oklch(0 0 0)", hex: "#ffffff" }],
    });
    expect(html).toContain("Tokens del Design System");
    expect(html).toContain("--bg-base");
  });

  it("ComponentesView lista 18 componentes", () => {
    const html = ComponentesView();
    expect(html).toContain("18/18");
    expect(html.match(/data-component="/g)?.length).toBe(18);
  });

  it("PreviewView marca la página activa y el código inválido", () => {
    const pages = [
      { slug: "home", html: "<p>Hola</p>" },
      { slug: "contacto", html: "<p>Contacto</p>" },
    ];
    const html = PreviewView(pages, "home", "COMP_001", ["COMP_001", "A11Y_001"]);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("COMP_001");
    expect(html).toContain("Preview del bundle golden");
  });
});
