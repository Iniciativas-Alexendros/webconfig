import { esc, link } from "../lib/render.js";

export interface HeroProps {
  headline: string;
  subheadline?: string;
  cta: { label: string; href: string; variant?: "primary" | "secondary" | "outline" };
  background?: { src: string; alt: string };
}

export function render(p: HeroProps): string {
  const variant = p.cta.variant ?? "primary";
  const bg = p.background ? `<img src="${esc(p.background.src)}" alt="${esc(p.background.alt)}" loading="lazy" />` : "";
  return `<section class="hero" aria-label="${esc(p.headline)}">${bg}<h1>${esc(p.headline)}</h1>${
    p.subheadline ? `<p class="lead">${esc(p.subheadline)}</p>` : ""
  }<p>${link(p.cta.label, p.cta.href, variant)}</p></section>`;
}

export const sample: HeroProps = {
  headline: "Sonrisas que transforman vidas",
  subheadline: "Odontología de vanguardia con trato humano",
  cta: { label: "Pide tu cita", href: "/contacto", variant: "primary" },
  background: { src: "assets/media/images/hero-dental.jpg", alt: "Equipo dental atendiendo a un paciente" },
};
