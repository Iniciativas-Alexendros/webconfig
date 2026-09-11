import { esc, link } from "../lib/render.js";

export interface HeaderProps {
  logo: { src: string; alt: string; href: string };
  navigation: Array<{ label: string; href: string }>;
  cta?: { label: string; href: string; variant?: "primary" | "secondary" };
}

export function render(p: HeaderProps): string {
  const nav = p.navigation.map((n) => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join("");
  return `<header class="site-header"><div class="cluster"><a href="${esc(p.logo.href)}"><img src="${esc(p.logo.src)}" alt="${esc(p.logo.alt)}" width="40" height="40" /></a><nav aria-label="Principal"><ul>${nav}</ul></nav>${
    p.cta ? link(p.cta.label, p.cta.href, p.cta.variant ?? "primary") : ""
  }</div></header>`;
}

export const sample: HeaderProps = {
  logo: { src: "assets/brand/logo.svg", alt: "Clínica Dental Sur", href: "/" },
  navigation: [
    { label: "Inicio", href: "/" },
    { label: "Servicios", href: "/servicios" },
    { label: "Contacto", href: "/contacto" },
  ],
  cta: { label: "Reservar cita", href: "/contacto", variant: "primary" },
};
