import { esc, safeUrl, clampInt } from "../lib/render.js";

export interface GalleryProps {
  images: Array<{ src: string; alt: string; caption?: string }>;
  columns?: 1 | 2 | 3 | 4;
}

export function render(p: GalleryProps): string {
  if (!p || !Array.isArray(p.images) || p.images.length === 0) {
    return `<div class="badge" data-tone="danger">Gallery: images requerido (array no vacío)</div>`;
  }
  const columns = clampInt(p.columns ?? 3, 1, 4, 3);
  const figs = p.images
    .filter((i) => i && typeof i.src === "string" && typeof i.alt === "string" && i.alt)
    .map(
      (i) =>
        `<figure><img src="${esc(safeUrl(i.src, "#"))}" alt="${esc(i.alt)}" loading="lazy" />${i.caption ? `<figcaption>${esc(i.caption)}</figcaption>` : ""}</figure>`
    )
    .join("");
  if (!figs) return `<div class="badge" data-tone="danger">Gallery: ninguna imagen válida (alt requerido)</div>`;
  return `<div class="gallery" data-columns="${columns}" role="group" aria-label="Galería de imágenes">${figs}</div>`;
}

export const sample: GalleryProps = {
  columns: 3,
  images: [
    { src: "assets/media/images/implantes.jpg", alt: "Implante dental", caption: "Implantes" },
    { src: "assets/media/images/ortodoncia.jpg", alt: "Alineadores transparentes" },
  ],
};
