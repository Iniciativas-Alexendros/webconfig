import { esc } from "../lib/render.js";

export interface ContactFormProps {
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "email" | "tel" | "textarea" | "select";
    required: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  submitLabel: string;
  successMessage?: string;
}

export function render(p: ContactFormProps): string {
  const fields = p.fields
    .map((f) => {
      const req = f.required ? ' required aria-required="true"' : "";
      const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : "";
      const control =
        f.type === "textarea"
          ? `<textarea id="f-${esc(f.name)}" name="${esc(f.name)}"${req}${ph}></textarea>`
          : f.type === "select"
            ? `<select id="f-${esc(f.name)}" name="${esc(f.name)}"${req}>${(f.options ?? [])
                .map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`)
                .join("")}</select>`
            : `<input id="f-${esc(f.name)}" name="${esc(f.name)}" type="${esc(f.type)}"${req}${ph} />`;
      return `<div class="form-field"><label for="f-${esc(f.name)}">${esc(f.label)}${f.required ? " *" : ""}</label>${control}</div>`;
    })
    .join("");
  return `<form class="contact-form" method="post" action="#">${fields}<button class="btn" data-variant="primary" type="submit">${esc(p.submitLabel)}</button>${
    p.successMessage ? `<p class="caption" role="status">${esc(p.successMessage)}</p>` : ""
  }</form>`;
}

export const sample: ContactFormProps = {
  fields: [
    { name: "nombre", label: "Nombre", type: "text", required: true, placeholder: "Tu nombre" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "tu@email.es" },
    { name: "mensaje", label: "Mensaje", type: "textarea", required: false },
  ],
  submitLabel: "Enviar mensaje",
  successMessage: "Te responderemos en 24h.",
};
