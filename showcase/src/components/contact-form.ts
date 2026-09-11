import { esc, safeId } from "../lib/render.js";

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

const FIELD_TYPES = ["text", "email", "tel", "textarea", "select"] as const;
const AUTOCOMPLETE: Record<string, string> = { email: ' autocomplete="email"', tel: ' autocomplete="tel"', text: "" };

export function render(p: ContactFormProps): string {
  if (!p || !Array.isArray(p.fields) || p.fields.length === 0 || typeof p.submitLabel !== "string") {
    return `<div class="badge" data-tone="danger">Contact-form: fields y submitLabel requeridos</div>`;
  }
  const fields = p.fields
    .filter((f) => f && typeof f.name === "string" && typeof f.label === "string" && FIELD_TYPES.includes(f.type))
    .map((f) => {
      const id = safeId(`f-${f.name}`, "field");
      const req = f.required ? ' required aria-required="true"' : "";
      const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : "";
      if (f.type === "textarea") {
        return `<div class="form-field"><label for="${id}">${esc(f.label)}${f.required ? " *" : ""}</label><textarea id="${id}" name="${esc(f.name)}"${req}${ph}></textarea></div>`;
      }
      if (f.type === "select") {
        const options = (f.options ?? []).filter(
          (o) => o && typeof o.value === "string" && typeof o.label === "string"
        );
        if (options.length === 0) return "";
        return `<div class="form-field"><label for="${id}">${esc(f.label)}${f.required ? " *" : ""}</label><select id="${id}" name="${esc(f.name)}"${req}>${options
          .map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`)
          .join("")}</select></div>`;
      }
      const kind = f.type as "text" | "email" | "tel";
      return `<div class="form-field"><label for="${id}">${esc(f.label)}${f.required ? " *" : ""}</label><input id="${id}" name="${esc(f.name)}" type="${kind}"${AUTOCOMPLETE[kind] ?? ""}${req}${ph} /></div>`;
    })
    .join("");
  return `<form class="contact-form" method="post" action="#contacto" novalidate>${fields}<button class="btn" data-variant="primary" type="submit">${esc(p.submitLabel)}</button></form>`;
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
