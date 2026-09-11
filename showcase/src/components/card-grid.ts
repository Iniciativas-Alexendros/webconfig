import { esc } from "../lib/render.js";

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
  const cards = p.cards
    .map(
      (c) =>
        `<article class="card"><img src="${esc(c.image.src)}" alt="${esc(c.image.alt)}" loading="lazy" /><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><p><a class="btn" data-variant="secondary" href="${esc(c.link.href)}" target="${esc(c.link.target)}">${esc(c.link.label)}</a></p></article>`
    )
    .join("");
  return `<div class="grid-cards" data-columns="${esc(p.columns ?? 3)}">${cards}</div>`;
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
