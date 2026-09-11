import * as hero from "../components/hero.js";
import * as header from "../components/header.js";
import * as footer from "../components/footer.js";
import * as navMain from "../components/nav-main.js";
import * as navBreadcrumb from "../components/nav-breadcrumb.js";
import * as textBlock from "../components/text-block.js";
import * as heading from "../components/heading.js";
import * as cardGrid from "../components/card-grid.js";
import * as priceTable from "../components/price-table.js";
import * as iconList from "../components/icon-list.js";
import * as testimonial from "../components/testimonial.js";
import * as contactForm from "../components/contact-form.js";
import * as bookingForm from "../components/booking-form.js";
import * as newsletterForm from "../components/newsletter-form.js";
import * as image from "../components/image.js";
import * as gallery from "../components/gallery.js";
import * as video from "../components/video.js";
import * as carousel from "../components/carousel.js";

export interface CatalogEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  render: (props: never) => string;
  sample: unknown;
}

function entry(
  id: string,
  name: string,
  category: string,
  description: string,
  mod: { render: (p: never) => string; sample: unknown }
): CatalogEntry {
  return { id, name, category, description, render: mod.render, sample: mod.sample };
}

export const registry: CatalogEntry[] = [
  entry("hero", "Hero Section", "layout", "Hero con titular, subtítulo y CTA", hero),
  entry("header", "Site Header", "layout", "Cabecera con logo, navegación y CTA", header),
  entry("footer", "Site Footer", "layout", "Pie con enlaces y redes", footer),
  entry("nav-main", "Main Navigation", "nav", "Navegación horizontal con desplegables", navMain),
  entry("nav-breadcrumb", "Breadcrumb Navigation", "nav", "Migas de pan", navBreadcrumb),
  entry("text-block", "Text Block", "content", "Bloque de texto", textBlock),
  entry("heading", "Heading", "content", "Titular con nivel 1-6", heading),
  entry("card-grid", "Card Grid", "content", "Rejilla de tarjetas", cardGrid),
  entry("price-table", "Price Table", "content", "Tabla de precios", priceTable),
  entry("icon-list", "Icon List", "content", "Lista con iconos", iconList),
  entry("testimonial", "Testimonial", "content", "Testimonio con avatar", testimonial),
  entry("contact-form", "Contact Form", "form", "Formulario de contacto", contactForm),
  entry("booking-form", "Booking Form", "form", "Formulario de reserva", bookingForm),
  entry("newsletter-form", "Newsletter Form", "form", "Suscripción newsletter", newsletterForm),
  entry("image", "Image", "media", "Imagen con alt y pie", image),
  entry("gallery", "Image Gallery", "media", "Galería responsive", gallery),
  entry("video", "Video Player", "media", "Reproductor con pausa", video),
  entry("carousel", "Carousel", "media", "Carrusel con navegación", carousel),
];

export function renderByType(type: string, props: unknown): string {
  const found = registry.find((r) => r.id === type);
  if (!found) return `<div class="badge" data-tone="danger">Componente desconocido: ${String(type)}</div>`;
  return found.render(props as never);
}
