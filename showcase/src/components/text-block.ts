import { esc } from "../lib/render.js";

export interface TextBlockProps {
  content: string;
  variant?: "body" | "lead" | "caption";
}

const VARIANTS = ["body", "lead", "caption"] as const;

export function render(p: TextBlockProps): string {
  if (!p || typeof p.content !== "string" || !p.content) {
    return `<div class="badge" data-tone="danger">Text-block: content requerido</div>`;
  }
  const variant = VARIANTS.includes(p.variant as (typeof VARIANTS)[number]) ? p.variant : "body";
  return `<div class="text-block" data-variant="${variant}"><p>${esc(p.content)}</p></div>`;
}

export const sample: TextBlockProps = {
  content: "¿Listo para recuperar tu sonrisa? Primera consulta sin compromiso.",
  variant: "lead",
};
