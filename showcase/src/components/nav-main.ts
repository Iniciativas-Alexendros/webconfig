import { esc } from "../lib/render.js";

export interface NavMainProps {
  items: Array<{ label: string; href: string; children?: Array<{ label: string; href: string }> }>;
}

export function render(p: NavMainProps): string {
  const items = p.items
    .map((i) => {
      const kids = (i.children ?? []).map((c) => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join("");
      return `<li><a href="${esc(i.href)}">${esc(i.label)}</a>${kids ? `<ul>${kids}</ul>` : ""}</li>`;
    })
    .join("");
  return `<nav class="nav-main" aria-label="Navegación principal"><ul>${items}</ul></nav>`;
}

export const sample: NavMainProps = {
  items: [
    { label: "Inicio", href: "/" },
    {
      label: "Servicios",
      href: "/servicios",
      children: [{ label: "Implantes", href: "/servicios#implantes" }],
    },
    { label: "Contacto", href: "/contacto" },
  ],
};
