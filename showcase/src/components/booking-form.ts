import { esc, safeId } from "../lib/render.js";

export interface BookingFormProps {
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: { amount: number; currency: string };
  }>;
  submitLabel: string;
}

export function render(p: BookingFormProps): string {
  if (!p || !Array.isArray(p.services) || p.services.length === 0 || typeof p.submitLabel !== "string") {
    return `<div class="badge" data-tone="danger">Booking-form: services y submitLabel requeridos</div>`;
  }
  const services = p.services.filter(
    (s) =>
      s &&
      typeof s.id === "string" &&
      typeof s.name === "string" &&
      Number.isInteger(s.duration) &&
      s.duration > 0 &&
      s.price &&
      typeof s.price.amount === "number" &&
      s.price.amount >= 0 &&
      /^[A-Z]{3}$/.test(s.price.currency ?? "")
  );
  if (services.length === 0) return `<div class="badge" data-tone="danger">Booking-form: ningún servicio válido</div>`;
  const options = services
    .map(
      (s) =>
        `<option value="${esc(s.id)}">${esc(s.name)} — ${esc(s.duration)} min (${esc(s.price.amount)} ${esc(s.price.currency)})</option>`
    )
    .join("");
  const serviceId = safeId("bk-service", "booking");
  const dateId = safeId("bk-date", "booking");
  return `<form class="booking-form" method="post" action="#reserva" novalidate><div class="form-field"><label for="${serviceId}">Servicio *</label><select id="${serviceId}" name="service" required aria-required="true">${options}</select></div><div class="form-field"><label for="${dateId}">Fecha *</label><input id="${dateId}" name="date" type="date" required aria-required="true" /></div><button class="btn" data-variant="primary" type="submit">${esc(p.submitLabel)}</button></form>`;
}

export const sample: BookingFormProps = {
  services: [
    { id: "higiene", name: "Higiene dental", duration: 45, price: { amount: 49, currency: "EUR" } },
    { id: "implante", name: "Implante", duration: 90, price: { amount: 890, currency: "EUR" } },
  ],
  submitLabel: "Reservar cita",
};
