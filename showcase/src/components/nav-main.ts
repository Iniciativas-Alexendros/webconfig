import { esc, safeUrl, uniqueId } from "../lib/render.js";

export interface NavMainProps {
  items: Array<{ label: string; href: string; children?: Array<{ label: string; href: string }> }>;
}

export function render(p: NavMainProps): string {
  if (!p || !Array.isArray(p.items) || p.items.length === 0) {
    return `<div class="badge" data-tone="danger">Nav-main: items requerido (array no vacío)</div>`;
  }
  const items = p.items
    .filter((i) => i && typeof i.label === "string" && typeof i.href === "string")
    .map((i) => {
      const kids = (i.children ?? [])
        .filter((c) => c && typeof c.label === "string" && typeof c.href === "string")
        .map((c) => `<li><a href="${esc(safeUrl(c.href, "#"))}">${esc(c.label)}</a></li>`)
        .join("");
      if (!kids) return `<li><a href="${esc(safeUrl(i.href, "#"))}">${esc(i.label)}</a></li>`;
      const id = uniqueId("nav");
      return `<li><a href="${esc(safeUrl(i.href, "#"))}" aria-expanded="false" aria-controls="${id}">${esc(i.label)}</a><ul id="${id}">${kids}</ul></li>`;
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
