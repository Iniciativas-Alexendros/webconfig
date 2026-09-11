import { esc, icon } from "../lib/render.js";

export interface FooterProps {
  copyright: string;
  links: Array<{ label: string; href: string }>;
  social?: Array<{ label: string; href: string; icon: string }>;
}

export function render(p: FooterProps): string {
  const links = p.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("");
  const social = (p.social ?? [])
    .map((s) => `<li><a href="${esc(s.href)}">${icon(s.icon)} ${esc(s.label)}</a></li>`)
    .join("");
  return `<footer class="site-footer"><nav aria-label="Secundaria"><ul>${links}</ul></nav>${
    social ? `<ul>${social}</ul>` : ""
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
