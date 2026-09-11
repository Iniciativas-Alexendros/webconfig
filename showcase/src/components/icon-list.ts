import { esc, icon } from "../lib/render.js";

export interface IconListProps {
  items: Array<{ icon: string; text: string }>;
}

export function render(p: IconListProps): string {
  return `<ul class="icon-list">${p.items.map((i) => `<li>${icon(i.icon)}<span>${esc(i.text)}</span></li>`).join("")}</ul>`;
}

export const sample: IconListProps = {
  items: [
    { icon: "check-circle", text: "Equipo con 20+ años de experiencia" },
    { icon: "shield", text: "Garantía de 10 años en implantes" },
  ],
};
