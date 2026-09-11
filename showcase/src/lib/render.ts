export function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("`", "&#96;");
}

const SAFE_URL = /^(https?:\/\/|\/|#|mailto:|tel:)[^\s"'<>`]*$/i;

export function safeUrl(value: unknown, fallback = "#"): string {
  const raw = String(value ?? "").trim();
  if (SAFE_URL.test(raw)) return raw;
  return fallback;
}

export function safeTarget(value: unknown): "_self" | "_blank" {
  return value === "_blank" ? "_blank" : "_self";
}

export function relForTarget(target: string): string {
  return target === "_blank" ? ' rel="noopener noreferrer"' : "";
}

export function link(label: unknown, href: unknown, variant = "primary"): string {
  const url = safeUrl(href, "#");
  return `<a class="btn" data-variant="${esc(variant)}" href="${esc(url)}">${esc(label)}</a>`;
}

export function extLink(label: unknown, href: unknown, target: unknown): string {
  const t = safeTarget(target);
  const url = safeUrl(href, "#");
  return `<a class="btn" data-variant="secondary" href="${esc(url)}" target="${t}"${relForTarget(t)}>${esc(label)}</a>`;
}

let uidCounter = 0;

export function uniqueId(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
}

export function safeId(value: unknown, fallbackPrefix: string): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (/^[a-z][a-z0-9-_]*$/.test(raw)) return raw;
  return uniqueId(fallbackPrefix);
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n)) return fallback;
  if (n < min || n > max) return fallback;
  return n;
}

export function icon(name: unknown): string {
  return `<span class="badge" aria-hidden="true">${esc(name)}</span>`;
}
