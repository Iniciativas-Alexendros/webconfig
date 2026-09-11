import { esc, link, safeUrl } from "../lib/render.js";

export interface HeroProps {
  headline: string;
  subheadline?: string;
  cta: { label: string; href: string; variant?: "primary" | "secondary" | "outline" };
  background?: { src: string; alt: string };
}

const VARIANTS = ["primary", "secondary", "outline"] as const;

export function render(p: HeroProps): string {
  if (
    !p ||
    typeof p.headline !== "string" ||
    !p.cta ||
    typeof p.cta.label !== "string" ||
    typeof p.cta.href !== "string"
  ) {
    return `<div class="badge" data-tone="danger">Hero: faltan props requeridas (headline, cta.label, cta.href)</div>`;
  }
  const variant = VARIANTS.includes(p.cta.variant as (typeof VARIANTS)[number]) ? p.cta.variant : "primary";
  const bg =
    p.background && typeof p.background.src === "string" && typeof p.background.alt === "string" && p.background.alt
      ? `<img src="${esc(safeUrl(p.background.src, "#"))}" alt="${esc(p.background.alt)}" loading="lazy" />`
      : "";
  return `<section class="hero">${bg}<h1>${esc(p.headline)}</h1>${
    p.subheadline ? `<p class="lead">${esc(p.subheadline)}</p>` : ""
  }<p>${link(p.cta.label, p.cta.href, variant as string)}</p></section>`;
}

export const sample: HeroProps = {
  headline: "Sonrisas que transforman vidas",
  subheadline: "Odontología de vanguardia con trato humano",
  cta: { label: "Pide tu cita", href: "/contacto", variant: "primary" },
  background: { src: "assets/media/images/hero-dental.jpg", alt: "Equipo dental atendiendo a un paciente" },
};
