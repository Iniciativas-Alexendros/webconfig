import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve("landing/index.html"), "utf-8");
const css = readFileSync(resolve("landing/landing.css"), "utf-8");

describe("landing estática", () => {
  it("está en español y enlaza el CSS generado", () => {
    expect(html).toMatch(/<html lang="es">/);
    expect(html).toContain('href="../dist-tokens/css/variables.css"');
    expect(html).toContain('href="./landing.css"');
  });

  it("ordena cabecera, propuesta, características, funcionalidades, roadmap y cierre", () => {
    const marks = [
      'class="header"',
      'class="hero"',
      'class="features"',
      'class="functions"',
      'class="roadmap"',
      'class="close"',
    ];
    const indexes = marks.map((mark) => html.indexOf(mark));
    expect(indexes.every((index) => index >= 0)).toBe(true);
    const sorted = [...indexes].sort((a, b) => a - b);
    expect(indexes).toEqual(sorted);
  });

  it("expone landmarks, foco y movimiento reducido", () => {
    expect(html).toContain("<header");
    expect(html).toContain("<main");
    expect(html).toContain("<footer");
    expect(html).toContain("<nav");
    expect(html).toContain('id="theme-toggle"');
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("no pinta con hex ni oklch sueltos", () => {
    const paint = `${html}\n${css}`;
    expect(paint).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(paint).not.toMatch(/oklch\s*\(/);
  });
});
