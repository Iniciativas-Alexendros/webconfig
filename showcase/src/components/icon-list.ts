import { esc, icon } from "../lib/render.js";

export interface IconListProps {
  items: Array<{ icon: string; text: string }>;
}

const KNOWN_ICONS = [
  "check-circle",
  "award",
  "shield",
  "clock",
  "map-pin",
  "phone",
  "mail",
  "star",
  "heart",
  "user",
  "home",
  "search",
  "menu",
  "close",
  "chevron-down",
  "chevron-up",
  "chevron-left",
  "chevron-right",
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "youtube",
  "github",
];

export function render(p: IconListProps): string {
  if (!p || !Array.isArray(p.items) || p.items.length === 0) {
    return `<div class="badge" data-tone="danger">Icon-list: items requerido (array no vacío)</div>`;
  }
  const items = p.items
    .filter((i) => i && typeof i.text === "string" && typeof i.icon === "string" && KNOWN_ICONS.includes(i.icon))
    .map((i) => `<li>${icon(i.icon)}<span>${esc(i.text)}</span></li>`)
    .join("");
  if (!items) return `<div class="badge" data-tone="danger">Icon-list: ningún icono válido del catálogo</div>`;
  return `<ul class="icon-list">${items}</ul>`;
}

export const sample: IconListProps = {
  items: [
    { icon: "check-circle", text: "Equipo con 20+ años de experiencia" },
    { icon: "shield", text: "Garantía de 10 años en implantes" },
  ],
};
