import { esc } from "../lib/render.js";

export interface NavBreadcrumbProps {
  items: Array<{ label: string; href?: string | null }>;
}

export function render(p: NavBreadcrumbProps): string {
  const items = p.items
    .map((i, idx) => {
      const last = idx === p.items.length - 1;
      const inner =
        i.href && !last
          ? `<a href="${esc(i.href)}">${esc(i.label)}</a>`
          : `<span aria-current="page">${esc(i.label)}</span>`;
      return `<li>${inner}</li>`;
    })
    .join(`<li aria-hidden="true">/</li>`);
  return `<nav class="breadcrumb" aria-label="Migas de pan"><ol>${items}</ol></nav>`;
}

export const sample: NavBreadcrumbProps = {
  items: [
    { label: "Inicio", href: "/" },
    { label: "Servicios", href: "/servicios" },
    { label: "Implantes", href: null },
  ],
};
