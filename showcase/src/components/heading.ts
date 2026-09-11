import { esc, clampInt } from "../lib/render.js";

export interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export function render(p: HeadingProps): string {
  const level = clampInt(p?.level, 1, 6, 0);
  if (level === 0 || typeof p?.text !== "string" || !p.text) {
    return `<div class="badge" data-tone="danger">Heading: level entero 1-6 y text requeridos</div>`;
  }
  return `<h${level}>${esc(p.text)}</h${level}>`;
}

export const sample: HeadingProps = { level: 2, text: "Nuestros tratamientos" };
