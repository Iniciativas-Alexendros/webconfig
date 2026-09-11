import { esc } from "../lib/render.js";

export interface NewsletterFormProps {
  placeholder: string;
  submitLabel: string;
  successMessage: string;
  privacyPolicyUrl?: string;
}

export function render(p: NewsletterFormProps): string {
  return `<form class="newsletter-form" method="post" action="#"><div class="form-field"><label for="nl-email">Email</label><input id="nl-email" name="email" type="email" placeholder="${esc(p.placeholder)}" required aria-required="true" /></div><button class="btn" data-variant="secondary" type="submit">${esc(p.submitLabel)}</button><p class="caption" role="status">${esc(p.successMessage)}${
    p.privacyPolicyUrl ? ` <a href="${esc(p.privacyPolicyUrl)}">Privacidad</a>` : ""
  }</p></form>`;
}

export const sample: NewsletterFormProps = {
  placeholder: "tu@email.es",
  submitLabel: "Suscribirme",
  successMessage: "Revisa tu bandeja para confirmar.",
  privacyPolicyUrl: "/politica-privacidad",
};
