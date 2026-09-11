import { esc } from "../lib/render.js";

export interface ImageProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export function render(p: ImageProps): string {
  const dims = `${p.width ? ` width="${esc(p.width)}"` : ""}${p.height ? ` height="${esc(p.height)}"` : ""}`;
  return `<figure class="image-block"><img src="${esc(p.src)}" alt="${esc(p.alt)}"${dims} loading="lazy" />${
    p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""
  }</figure>`;
}

export const sample: ImageProps = {
  src: "assets/media/images/hero-dental.jpg",
  alt: "Equipo dental atendiendo a un paciente sonriente",
  caption: "Nuestro equipo en acción",
};
