import { esc, extLink, safeUrl, clampInt } from "../lib/render.js";

export interface CardGridProps {
  columns?: 1 | 2 | 3 | 4;
  cards: Array<{
    title: string;
    description: string;
    image: { src: string; alt: string };
    link: { label: string; href: string; target: "_self" | "_blank" };
  }>;
}

export function render(p: CardGridProps): string {
  if (!p || !Array.isArray(p.cards) || p.cards.length === 0) {
    return `<div class="badge" data-tone="danger">Card-grid: cards requerido (array no vacío)</div>`;
  }
  const columns = clampInt(p.columns ?? 3, 1, 4, 3);
  const cards = p.cards
    .filter(
      (c) => c && typeof c.title === "string" && c.image && typeof c.image.alt === "string" && c.image.alt && c.link
    )
    .map(
      (c) =>
        `<article class="card"><img src="${esc(safeUrl(c.image.src, "#"))}" alt="${esc(c.image.alt)}" loading="lazy" /><h3>${esc(c.title)}</h3><p>${esc(c.description ?? "")}</p><p>${extLink(c.link.label, c.link.href, c.link.target)}</p></article>`
    )
    .join("");
  if (!cards) return `<div class="badge" data-tone="danger">Card-grid: ninguna tarjeta válida (alt requerido)</div>`;
  return `<div class="grid-cards" data-columns="${columns}">${cards}</div>`;
}

export const sample: CardGridProps = {
  columns: 3,
  cards: [
    {
      title: "Implantología",
      description: "Implantes de titanio con carga inmediata.",
      image: { src: "assets/media/images/implantes.jpg", alt: "Implante dental" },
      link: { label: "Ver detalles", href: "/servicios#implantes", target: "_self" },
    },
    {
      title: "Ortodoncia Invisible",
      description: "Alineadores transparentes sin brackets.",
      image: { src: "assets/media/images/ortodoncia.jpg", alt: "Alineadores transparentes" },
      link: { label: "Ver detalles", href: "/servicios#ortodoncia", target: "_self" },
    },
  ],
};
