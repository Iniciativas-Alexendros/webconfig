import { esc } from "../lib/render.js";

export interface GalleryProps {
  images: Array<{ src: string; alt: string; caption?: string }>;
  columns?: 1 | 2 | 3 | 4;
}

export function render(p: GalleryProps): string {
  const figs = p.images
    .map(
      (i) =>
        `<figure><img src="${esc(i.src)}" alt="${esc(i.alt)}" loading="lazy" />${i.caption ? `<figcaption>${esc(i.caption)}</figcaption>` : ""}</figure>`
    )
    .join("");
  return `<div class="gallery" data-columns="${esc(p.columns ?? 3)}" role="group" aria-label="Galería de imágenes">${figs}</div>`;
}

export const sample: GalleryProps = {
  columns: 3,
  images: [
    { src: "assets/media/images/implantes.jpg", alt: "Implante dental", caption: "Implantes" },
    { src: "assets/media/images/ortodoncia.jpg", alt: "Alineadores transparentes" },
  ],
};
