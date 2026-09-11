import { esc } from "../lib/render.js";

export interface TextBlockProps {
  content: string;
  variant?: "body" | "lead" | "caption";
}

export function render(p: TextBlockProps): string {
  return `<div class="text-block" data-variant="${esc(p.variant ?? "body")}"><p>${esc(p.content)}</p></div>`;
}

export const sample: TextBlockProps = {
  content: "¿Listo para recuperar tu sonrisa? Primera consulta sin compromiso.",
  variant: "lead",
};
