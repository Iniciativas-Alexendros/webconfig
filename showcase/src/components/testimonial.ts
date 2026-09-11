import { esc } from "../lib/render.js";

export interface TestimonialProps {
  avatar: { src: string; alt: string };
  quote: string;
  author: { name: string; role: string };
}

export function render(p: TestimonialProps): string {
  return `<figure class="testimonial"><img src="${esc(p.avatar.src)}" alt="${esc(p.avatar.alt)}" width="64" height="64" loading="lazy" /><blockquote><p>${esc(p.quote)}</p></blockquote><figcaption><strong>${esc(p.author.name)}</strong> — ${esc(p.author.role)}</figcaption></figure>`;
}

export const sample: TestimonialProps = {
  avatar: { src: "assets/media/images/paciente-maria.jpg", alt: "María González" },
  quote: "El trato fue excepcional. Ahora sonrío con confianza.",
  author: { name: "María González", role: "Paciente de Implantología" },
};
