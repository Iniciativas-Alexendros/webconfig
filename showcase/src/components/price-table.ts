import { esc, link } from "../lib/render.js";

export interface PriceTableProps {
  plans: Array<{
    name: string;
    price: { amount: number; currency: string; period: "month" | "year" | "once" | "session" };
    features: string[];
    cta: { label: string; href: string; variant?: "primary" | "secondary" | "outline" };
    highlighted?: boolean;
  }>;
}

const PERIOD: Record<string, string> = { month: "/mes", year: "/año", once: "pago único", session: "/sesión" };

export function render(p: PriceTableProps): string {
  const plans = p.plans
    .map(
      (plan) =>
        `<article class="price-plan" data-highlighted="${plan.highlighted ? "true" : "false"}"><h3>${esc(plan.name)}</h3><p><strong>${esc(plan.price.amount)} ${esc(plan.price.currency)}</strong> <span class="caption">${esc(PERIOD[plan.price.period] ?? plan.price.period)}</span></p><ul>${plan.features
          .map((f) => `<li>${esc(f)}</li>`)
          .join("")}</ul><p>${link(plan.cta.label, plan.cta.href, plan.cta.variant ?? "primary")}</p></article>`
    )
    .join("");
  return `<div class="price-table">${plans}</div>`;
}

export const sample: PriceTableProps = {
  plans: [
    {
      name: "Higiene",
      price: { amount: 49, currency: "EUR", period: "session" },
      features: ["Limpieza completa", "Revisión"],
      cta: { label: "Reservar", href: "/contacto", variant: "outline" },
    },
    {
      name: "Implante",
      price: { amount: 890, currency: "EUR", period: "once" },
      features: ["Titanio", "Garantía 10 años"],
      cta: { label: "Pedir cita", href: "/contacto", variant: "primary" },
      highlighted: true,
    },
  ],
};
