import { esc } from "../lib/render.js";

export interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export function render(p: HeadingProps): string {
  const level = Math.min(6, Math.max(1, p.level));
  return `<h${level}>${esc(p.text)}</h${level}>`;
}

export const sample: HeadingProps = { level: 2, text: "Nuestros tratamientos" };
