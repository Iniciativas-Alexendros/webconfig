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
const CURRENCIES = /^[A-Z]{3}$/;
const PERIODS = ["month", "year", "once", "session"] as const;
const VARIANTS = ["primary", "secondary", "outline"] as const;

export function render(p: PriceTableProps): string {
  if (!p || !Array.isArray(p.plans) || p.plans.length === 0) {
    return `<div class="badge" data-tone="danger">Price-table: plans requerido (array no vacío)</div>`;
  }
  const plans = p.plans
    .filter(
      (plan) =>
        plan &&
        typeof plan.name === "string" &&
        plan.price &&
        typeof plan.price.amount === "number" &&
        plan.price.amount >= 0 &&
        typeof plan.price.currency === "string" &&
        CURRENCIES.test(plan.price.currency) &&
        PERIODS.includes(plan.price.period) &&
        Array.isArray(plan.features) &&
        plan.cta &&
        typeof plan.cta.label === "string" &&
        typeof plan.cta.href === "string"
    )
    .map(
      (plan) =>
        `<article class="price-plan" data-highlighted="${plan.highlighted ? "true" : "false"}">${plan.highlighted ? `<p><span class="badge" data-tone="success">Recomendado</span></p>` : ""}<h3>${esc(plan.name)}</h3><p><strong>${esc(plan.price.amount)} ${esc(plan.price.currency)}</strong> <span class="caption">${esc(PERIOD[plan.price.period] as string)}</span></p><ul>${plan.features
          .filter((f) => typeof f === "string")
          .map((f) => `<li>${esc(f)}</li>`)
          .join("")}</ul><p>${link(
          plan.cta.label,
          plan.cta.href,
          VARIANTS.includes(plan.cta.variant as (typeof VARIANTS)[number]) ? (plan.cta.variant as string) : "primary"
        )}</p></article>`
    )
    .join("");
  if (!plans) return `<div class="badge" data-tone="danger">Price-table: ningún plan válido</div>`;
  return `<div class="price-table" role="table" aria-label="Tabla de precios">${plans}</div>`;
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
