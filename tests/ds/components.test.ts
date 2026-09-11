import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { registry, renderByType } from "../../showcase/src/lib/registry.js";

const catalog = parse(readFileSync(resolve("ds-catalog.example.yaml"), "utf-8")) as {
  components: Array<{ id: string; propsSchema?: { required?: string[] } }>;
};

function checkRequired(id: string, html: string): void {
  if (["hero", "header", "image", "gallery", "carousel", "card-grid", "testimonial"].includes(id)) {
    expect(html, `${id} debe incluir alt`).toMatch(/alt="/);
  }
}

describe("componentes 18/18", () => {
  it("registry cubre todo el catalogo", () => {
    const ids = catalog.components.map((c) => c.id).sort();
    const rendered = registry.map((r) => r.id).sort();
    expect(rendered).toEqual(ids);
    expect(registry.length).toBe(18);
  });

  it.each(registry.map((r) => [r.id]))("%s renderiza con su sample", (id) => {
    const found = registry.find((r) => r.id === id);
    expect(found).toBeTruthy();
    const html = found!.render(found!.sample as never);
    expect(html.length).toBeGreaterThan(20);
    checkRequired(id, html);
  });

  it("renderByType desconocido no rompe", () => {
    expect(renderByType("no-existe", {})).toContain("Componente desconocido");
  });

  it("heading respeta niveles 1-6", () => {
    const { render } = registry.find((r) => r.id === "heading") as { render: (p: never) => string };
    expect(render({ level: 3, text: "Hola" } as never)).toContain("<h3>");
  });

  it("fixtures del catalogo tienen renderer fisico", () => {
    const files = readdirSync(resolve("showcase/src/components"));
    for (const comp of catalog.components) {
      expect(files, `falta ${comp.id}.ts`).toContain(`${comp.id}.ts`);
    }
  });
});
