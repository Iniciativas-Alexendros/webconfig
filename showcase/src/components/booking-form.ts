import { esc } from "../lib/render.js";

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
  const options = p.services
    .map(
      (s) =>
        `<option value="${esc(s.id)}">${esc(s.name)} — ${esc(s.duration)} min (${esc(s.price.amount)} ${esc(s.price.currency)})</option>`
    )
    .join("");
  return `<form class="booking-form" method="post" action="#"><div class="form-field"><label for="bk-service">Servicio *</label><select id="bk-service" name="service" required aria-required="true">${options}</select></div><div class="form-field"><label for="bk-date">Fecha *</label><input id="bk-date" name="date" type="text" placeholder="AAAA-MM-DD" required aria-required="true" /></div><button class="btn" data-variant="primary" type="submit">${esc(p.submitLabel)}</button></form>`;
}

export const sample: BookingFormProps = {
  services: [
    { id: "higiene", name: "Higiene dental", duration: 45, price: { amount: 49, currency: "EUR" } },
    { id: "implante", name: "Implante", duration: 90, price: { amount: 890, currency: "EUR" } },
  ],
  submitLabel: "Reservar cita",
};
