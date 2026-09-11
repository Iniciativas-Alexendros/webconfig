import { esc } from "../lib/render.js";

export interface CarouselProps {
  slides: Array<{
    image: { src: string; alt: string };
    caption?: string;
    link?: { href: string; label: string; target: "_self" | "_blank" };
  }>;
  autoplay: boolean;
  pauseControl: boolean;
  interval?: number;
}

export function render(p: CarouselProps): string {
  const slides = p.slides
    .map(
      (s) =>
        `<article><img src="${esc(s.image.src)}" alt="${esc(s.image.alt)}" loading="lazy" />${
          s.caption ? `<p>${esc(s.caption)}</p>` : ""
        }${s.link ? `<p><a class="btn" data-variant="secondary" href="${esc(s.link.href)}" target="${esc(s.link.target)}">${esc(s.link.label)}</a></p>` : ""}</article>`
    )
    .join("");
  return `<div class="carousel" data-autoplay="${p.autoplay ? "true" : "false"}" role="region" aria-roledescription="carrusel" aria-label="Carrusel"><div class="carousel-track">${slides}</div>${
    p.pauseControl
      ? `<p class="caption">Desliza horizontalmente. Autoplay ${p.autoplay ? `cada ${esc(p.interval ?? 5000)} ms` : "desactivado"}.</p>`
      : ""
  }</div>`;
}

export const sample: CarouselProps = {
  autoplay: false,
  pauseControl: true,
  slides: [
    { image: { src: "assets/media/images/implantes.jpg", alt: "Implante dental" }, caption: "Implantes" },
    { image: { src: "assets/media/images/estetica.jpg", alt: "Carillas dentales" }, caption: "Estética" },
  ],
};
