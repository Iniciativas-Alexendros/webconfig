import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCompositionYaml, parseSimpleYaml } from "../../showcase/src/lib/yaml.js";

describe("yaml parser del showcase", () => {
  it("parsea escalares básicos", () => {
    const doc = parseSimpleYaml("a: 1\nb: true\nc: hola\n") as Record<string, unknown>;
    expect(doc["a"]).toBe(1);
    expect(doc["b"]).toBe(true);
    expect(doc["c"]).toBe("hola");
  });

  it("parsea el composition home golden sin perder componentes", () => {
    const raw = readFileSync(resolve("fixtures/golden/clinica-dental-sur/composition/home.yaml"), "utf-8");
    const parsed = parseCompositionYaml(raw);
    expect(parsed.page).toBe("home");
    expect(parsed.components.length).toBeGreaterThanOrEqual(6);
    const hero = parsed.components.find((c) => c.type === "hero");
    expect(hero).toBeTruthy();
    expect(hero!.props).toHaveProperty("headline");
  });

  it("parsea las 3 páginas golden", () => {
    for (const slug of ["home", "servicios", "contacto"]) {
      const raw = readFileSync(resolve(`fixtures/golden/clinica-dental-sur/composition/${slug}.yaml`), "utf-8");
      const parsed = parseCompositionYaml(raw);
      expect(parsed.page).toBe(slug);
      expect(parsed.components.length).toBeGreaterThan(0);
    }
  });
});
