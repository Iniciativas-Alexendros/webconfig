import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { registry, renderByType } from "../../showcase/src/lib/registry.js";
import { safeUrl } from "../../showcase/src/lib/render.js";

const catalog = parse(readFileSync(resolve("ds-catalog.example.yaml"), "utf-8")) as {
  components: Array<{ id: string; propsSchema?: { required?: string[]; properties?: Record<string, unknown> } }>;
};

function imgsWithEmptyAlt(html: string): number {
  return (html.match(/<img[^>]*alt=""/g) ?? []).length;
}

describe("componentes 18/18", () => {
  it("registry cubre todo el catalogo", () => {
    const ids = catalog.components.map((c) => c.id).sort();
    const rendered = registry.map((r) => r.id).sort();
    expect(rendered).toEqual(ids);
    expect(registry.length).toBe(18);
  });

  it("samples cubren los required del propsSchema", () => {
    for (const comp of catalog.components) {
      const required = comp.propsSchema?.required ?? [];
      const found = registry.find((r) => r.id === comp.id);
      expect(found, `sin sample ${comp.id}`).toBeTruthy();
      const sample = found!.sample as Record<string, unknown>;
      for (const key of required) {
        expect(sample, `${comp.id} sample sin required ${key}`).toHaveProperty(key);
      }
    }
  });

  it.each(registry.map((r) => [r.id]))("%s renderiza estructura válida con su sample", (id) => {
    const found = registry.find((r) => r.id === id);
    expect(found).toBeTruthy();
    const html = found!.render(found!.sample as never);
    expect(html.length).toBeGreaterThan(id === "heading" ? 20 : 60);
    expect(html).not.toContain("faltan props");
    expect(html).not.toContain("requerido");
    if (html.includes("<img")) expect(html).toMatch(/<img[^>]*alt="[^"]+"/);
    expect(imgsWithEmptyAlt(html)).toBe(0);
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toMatch(/<hNaN>/);
    if (html.includes('target="_blank"')) expect(html).toContain('rel="noopener noreferrer"');
  });

  it("renderByType desconocido escapa el tipo (XSS)", () => {
    expect(renderByType("<img src=x onerror=alert(1)>", {})).not.toContain("<img src=x");
    expect(renderByType("no-existe", {})).toContain("Componente desconocido");
  });

  it("renderByType con props rotas no lanza", () => {
    expect(() => renderByType("hero", null)).not.toThrow();
    expect(renderByType("hero", null)).toContain("badge");
    expect(() => renderByType("card-grid", { cards: null })).not.toThrow();
  });

  it("safeUrl bloquea javascript: y data:", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("#");
    expect(safeUrl("data:text/html,<h1>x</h1>")).toBe("#");
    expect(safeUrl("/contacto")).toBe("/contacto");
    expect(safeUrl("https://example.com/a")).toBe("https://example.com/a");
  });

  it("heading valida niveles 1-6 e invalida el resto", () => {
    const { render } = registry.find((r) => r.id === "heading") as { render: (p: never) => string };
    expect(render({ level: 3, text: "Hola" } as never)).toBe("<h3>Hola</h3>");
    expect(render({ level: 1, text: "A" } as never)).toBe("<h1>A</h1>");
    expect(render({ level: 6, text: "F" } as never)).toBe("<h6>F</h6>");
    expect(render({ level: 2.5, text: "X" } as never)).toContain("badge");
    expect(render({ level: 0, text: "X" } as never)).toContain("badge");
    expect(render({ level: 7, text: "X" } as never)).toContain("badge");
  });

  it("fixtures del catalogo tienen renderer fisico", () => {
    const files = readdirSync(resolve("showcase/src/components"));
    for (const comp of catalog.components) {
      expect(files, `falta ${comp.id}.ts`).toContain(`${comp.id}.ts`);
    }
  });
});
