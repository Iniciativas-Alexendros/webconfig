import { esc, link, safeUrl } from "../lib/render.js";

export interface HeaderProps {
  logo: { src: string; alt: string; href: string };
  navigation: Array<{ label: string; href: string }>;
  cta?: { label: string; href: string; variant?: "primary" | "secondary" };
}

export function render(p: HeaderProps): string {
  if (!p || !p.logo || !Array.isArray(p.navigation)) {
    return `<div class="badge" data-tone="danger">Header: faltan props requeridas (logo, navigation)</div>`;
  }
  const nav = p.navigation
    .filter((n) => n && typeof n.label === "string" && typeof n.href === "string")
    .map((n) => `<li><a href="${esc(safeUrl(n.href, "#"))}">${esc(n.label)}</a></li>`)
    .join("");
  const variant = p.cta?.variant === "secondary" ? "secondary" : "primary";
  return `<header class="site-header"><div class="cluster"><a href="${esc(safeUrl(p.logo.href, "/"))}"><img src="${esc(safeUrl(p.logo.src, "#"))}" alt="${esc(p.logo.alt ?? "")}" width="40" height="40" /></a><nav aria-label="Principal"><ul>${nav}</ul></nav>${
    p.cta ? link(p.cta.label, p.cta.href, variant) : ""
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
