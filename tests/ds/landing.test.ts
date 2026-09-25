import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve("landing/index.html"), "utf-8");
const app = readFileSync(resolve("landing/src/LandingApp.tsx"), "utf-8");
const css = readFileSync(resolve("showcase/src/styles/app.css"), "utf-8");

describe("landing React + shadcn", () => {
  it("está en español y monta React", () => {
    expect(html).toMatch(/<html lang="es">/);
    expect(html).toContain('src="/landing/src/main.tsx"');
    expect(html).toContain('id="root"');
  });

  it("ordena cabecera, propuesta, características, funcionalidades, roadmap y cierre", () => {
    const marks = [
      'className="header',
      'className="hero',
      'className="features',
      'className="functions',
      'className="roadmap',
      'className="close',
    ];
    const indexes = marks.map((mark) => app.indexOf(mark));
    expect(indexes.every((index) => index >= 0)).toBe(true);
    const sorted = [...indexes].sort((a, b) => a - b);
    expect(indexes).toEqual(sorted);
  });

  it("expone landmarks, foco y movimiento reducido", () => {
    expect(app).toContain("<header");
    expect(app).toContain("<main");
    expect(app).toContain("<footer");
    expect(app).toContain("<nav");
    expect(app).toContain("ThemeCycleButton");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("no pinta con hex ni oklch sueltos en la landing", () => {
    const paint = `${html}\n${app}`;
    expect(paint).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(paint).not.toMatch(/oklch\s*\(/);
  });
});
