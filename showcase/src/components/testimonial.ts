import { esc, safeUrl } from "../lib/render.js";

export interface TestimonialProps {
  avatar: { src: string; alt: string };
  quote: string;
  author: { name: string; role: string };
}

export function render(p: TestimonialProps): string {
  if (
    !p ||
    !p.avatar ||
    typeof p.avatar.alt !== "string" ||
    !p.avatar.alt ||
    typeof p.quote !== "string" ||
    !p.quote ||
    !p.author ||
    typeof p.author.name !== "string" ||
    typeof p.author.role !== "string"
  ) {
    return `<div class="badge" data-tone="danger">Testimonial: faltan props requeridas (avatar.alt, quote, author)</div>`;
  }
  return `<figure class="testimonial"><img src="${esc(safeUrl(p.avatar.src, "#"))}" alt="${esc(p.avatar.alt)}" width="64" height="64" loading="lazy" /><blockquote><p>${esc(p.quote)}</p></blockquote><figcaption><strong>${esc(p.author.name)}</strong> — ${esc(p.author.role)}</figcaption></figure>`;
}

export const sample: TestimonialProps = {
  avatar: { src: "assets/media/images/paciente-maria.jpg", alt: "María González" },
  quote: "El trato fue excepcional. Ahora sonrío con confianza.",
  author: { name: "María González", role: "Paciente de Implantología" },
};
