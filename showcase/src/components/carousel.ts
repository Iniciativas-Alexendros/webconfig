import { esc, safeUrl, safeTarget, relForTarget, clampInt, uniqueId } from "../lib/render.js";

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
  if (
    !p ||
    !Array.isArray(p.slides) ||
    p.slides.length === 0 ||
    typeof p.autoplay !== "boolean" ||
    typeof p.pauseControl !== "boolean"
  ) {
    return `<div class="badge" data-tone="danger">Carousel: slides, autoplay y pauseControl requeridos</div>`;
  }
  if (p.autoplay && !p.pauseControl) {
    return `<div class="badge" data-tone="danger">Carousel: autoplay exige pauseControl (WCAG 2.2.2)</div>`;
  }
  const slides = p.slides.filter((s) => s && s.image && typeof s.image.alt === "string" && s.image.alt);
  if (slides.length === 0)
    return `<div class="badge" data-tone="danger">Carousel: ningún slide válido (alt requerido)</div>`;
  const id = uniqueId("carousel");
  const interval = clampInt(p.interval ?? 5000, 1000, 60000, 5000);
  const items = slides
    .map((s, idx) => {
      const t = safeTarget(s.link?.target);
      return `<article aria-roledescription="slide" aria-label="Slide ${idx + 1} de ${slides.length}"><img src="${esc(safeUrl(s.image.src, "#"))}" alt="${esc(s.image.alt)}" loading="lazy" />${
        s.caption ? `<p>${esc(s.caption)}</p>` : ""
      }${
        s.link && typeof s.link.href === "string" && typeof s.link.label === "string"
          ? `<p><a class="btn" data-variant="secondary" href="${esc(safeUrl(s.link.href, "#"))}" target="${t}"${relForTarget(t)}>${esc(s.link.label)}</a></p>`
          : ""
      }</article>`;
    })
    .join("");
  return `<div class="carousel" id="${id}" data-autoplay="${p.autoplay ? "true" : "false"}" role="region" aria-roledescription="carrusel" aria-label="Carrusel"><div class="carousel-track">${items}</div><div class="cluster"><button class="btn" data-variant="secondary" type="button" data-carousel-prev="${id}">Anterior</button><button class="btn" data-variant="secondary" type="button" data-carousel-next="${id}">Siguiente</button>${
    p.autoplay
      ? `<button class="btn" data-variant="outline" type="button" data-carousel-pause="${id}">Pausar</button>`
      : ""
  }</div>${
    p.pauseControl
      ? `<p class="caption">Autoplay ${p.autoplay ? `cada ${interval} ms (pausable)` : "desactivado"}.</p>`
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
