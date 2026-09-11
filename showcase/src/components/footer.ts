import { esc, icon, safeUrl } from "../lib/render.js";

export interface FooterProps {
  copyright: string;
  links: Array<{ label: string; href: string }>;
  social?: Array<{ label: string; href: string; icon: string }>;
}

export function render(p: FooterProps): string {
  if (!p || typeof p.copyright !== "string" || !Array.isArray(p.links)) {
    return `<div class="badge" data-tone="danger">Footer: faltan props requeridas (copyright, links)</div>`;
  }
  const links = p.links
    .filter((l) => l && typeof l.label === "string" && typeof l.href === "string")
    .map((l) => `<li><a href="${esc(safeUrl(l.href, "#"))}">${esc(l.label)}</a></li>`)
    .join("");
  const social = (p.social ?? [])
    .filter((s) => s && typeof s.label === "string" && typeof s.href === "string")
    .map((s) => `<li><a href="${esc(safeUrl(s.href, "#"))}">${icon(s.icon)} ${esc(s.label)}</a></li>`)
    .join("");
  return `<footer class="site-footer"><nav aria-label="Secundaria"><ul>${links}</ul></nav>${
    social ? `<nav aria-label="Redes sociales"><ul>${social}</ul></nav>` : ""
  }<p>${esc(p.copyright)}</p></footer>`;
}

export const sample: FooterProps = {
  copyright: "© 2026 Clínica Dental Sur. Todos los derechos reservados.",
  links: [
    { label: "Aviso Legal", href: "/aviso-legal" },
    { label: "Contacto", href: "/contacto" },
  ],
  social: [{ label: "Facebook", href: "https://facebook.com/clinicadentalsur", icon: "facebook" }],
};
