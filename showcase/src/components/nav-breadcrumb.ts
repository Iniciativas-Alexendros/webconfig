import { esc, safeUrl } from "../lib/render.js";

export interface NavBreadcrumbProps {
  items: Array<{ label: string; href?: string | null }>;
}

export function render(p: NavBreadcrumbProps): string {
  if (!p || !Array.isArray(p.items) || p.items.length === 0) {
    return `<div class="badge" data-tone="danger">Breadcrumb: items requerido (array no vacío)</div>`;
  }
  const items = p.items
    .filter((i) => i && typeof i.label === "string")
    .map((i, idx, arr) => {
      const last = idx === arr.length - 1;
      const sep = idx > 0 ? `<span aria-hidden="true"> / </span>` : "";
      const inner =
        i.href && !last
          ? `<a href="${esc(safeUrl(i.href, "#"))}">${esc(i.label)}</a>`
          : `<span aria-current="page">${esc(i.label)}</span>`;
      return `<li>${sep}${inner}</li>`;
    })
    .join("");
  return `<nav class="breadcrumb" aria-label="Migas de pan"><ol>${items}</ol></nav>`;
}

export const sample: NavBreadcrumbProps = {
  items: [
    { label: "Inicio", href: "/" },
    { label: "Servicios", href: "/servicios" },
    { label: "Implantes", href: null },
  ],
};
