import { esc, safeUrl } from "../lib/render.js";

export interface ImageProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export function render(p: ImageProps): string {
  if (!p || typeof p.src !== "string" || !p.src || typeof p.alt !== "string" || !p.alt) {
    return `<div class="badge" data-tone="danger">Image: src y alt no vacíos requeridos</div>`;
  }
  const dims = `${Number.isInteger(p.width) && (p.width as number) > 0 ? ` width="${p.width}"` : ""}${
    Number.isInteger(p.height) && (p.height as number) > 0 ? ` height="${p.height}"` : ""
  }`;
  return `<figure class="image-block"><img src="${esc(safeUrl(p.src, "#"))}" alt="${esc(p.alt)}"${dims} loading="lazy" />${
    p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""
  }</figure>`;
}

export const sample: ImageProps = {
  src: "assets/media/images/hero-dental.jpg",
  alt: "Equipo dental atendiendo a un paciente sonriente",
  caption: "Nuestro equipo en acción",
};
