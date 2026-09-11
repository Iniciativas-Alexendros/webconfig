import { esc, safeId, safeUrl } from "../lib/render.js";

export interface NewsletterFormProps {
  placeholder: string;
  submitLabel: string;
  successMessage: string;
  privacyPolicyUrl?: string;
}

export function render(p: NewsletterFormProps): string {
  if (
    !p ||
    typeof p.placeholder !== "string" ||
    typeof p.submitLabel !== "string" ||
    typeof p.successMessage !== "string"
  ) {
    return `<div class="badge" data-tone="danger">Newsletter: placeholder, submitLabel y successMessage requeridos</div>`;
  }
  const emailId = safeId("nl-email", "newsletter");
  const consentId = safeId("nl-consent", "newsletter");
  return `<form class="newsletter-form" method="post" action="#newsletter" novalidate><div class="form-field"><label for="${emailId}">Correo electrónico</label><input id="${emailId}" name="email" type="email" placeholder="${esc(p.placeholder)}" required aria-required="true" autocomplete="email" /></div><div class="form-field"><label for="${consentId}"><input id="${consentId}" name="consent" type="checkbox" required aria-required="true" /> Acepto la política de privacidad${
    p.privacyPolicyUrl ? ` (<a href="${esc(safeUrl(p.privacyPolicyUrl, "#"))}">leer</a>)` : ""
  }</label></div><button class="btn" data-variant="secondary" type="submit">${esc(p.submitLabel)}</button></form>`;
}

export const sample: NewsletterFormProps = {
  placeholder: "tu@email.es",
  submitLabel: "Suscribirme",
  successMessage: "Revisa tu bandeja para confirmar.",
  privacyPolicyUrl: "/politica-privacidad",
};
