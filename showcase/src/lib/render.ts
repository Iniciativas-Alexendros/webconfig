export function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function link(label: unknown, href: unknown, variant = "primary"): string {
  return `<a class="btn" data-variant="${esc(variant)}" href="${esc(href)}">${esc(label)}</a>`;
}

export function icon(name: unknown): string {
  return `<span class="badge" aria-hidden="true">${esc(name)}</span>`;
}
