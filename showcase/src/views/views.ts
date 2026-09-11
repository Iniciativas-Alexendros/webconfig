import { registry, renderByType } from "../lib/registry.js";
import { esc } from "../lib/render.js";

export function TokensView(tokens: {
  vars: Array<{ name: string; light: string; dark: string; hex: string }>;
}): string {
  const rows = tokens.vars
    .map(
      (t) =>
        `<tr><td><code>${esc(t.name)}</code></td><td><code>${esc(t.light)}</code></td><td><span class="swatch" style="background:${esc(t.hex || t.light)}" role="img" aria-label="Muestra ${esc(t.name)}"></span></td><td><code>${esc(t.hex)}</code></td><td><code>${esc(t.dark)}</code></td></tr>`
    )
    .join("");
  return `<div class="stack"><h1>Tokens del Design System</h1><p class="lead">Fuente OKLCH (W3C DTCG). Cambia el tema para ver light/dark.</p><div class="table-scroll"><table class="tokens"><thead><tr><th>Variable</th><th>Valor light</th><th>Muestra</th><th>Fallback hex</th><th>Valor dark</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

export function ComponentesView(): string {
  const cards = registry
    .map((c) => {
      let html: string;
      try {
        html = c.render(c.sample as never);
      } catch {
        html = `<div class="badge" data-tone="danger">Error al renderizar ${esc(c.id)}</div>`;
      }
      return `<article class="card" data-component="${esc(c.id)}"><p><span class="badge">${esc(c.category)}</span> <code>${esc(c.id)}</code></p><h2>${esc(c.name)}</h2><p class="caption">${esc(c.description)}</p><div class="preview">${html}</div></article>`;
    })
    .join("");
  return `<div class="stack"><h1>Componentes (${registry.length}/18)</h1><p class="lead">Render 1:1 con <code>ds-catalog.example.yaml</code>.</p><div class="grid-auto">${cards}</div></div>`;
}

export function PreviewView(
  pages: Array<{ slug: string; html: string }>,
  active: string,
  invalidCode: string | null,
  invalidCodes: string[]
): string {
  const tabs = pages
    .map(
      (p) =>
        `<a class="btn" data-variant="${p.slug === active ? "primary" : "secondary"}" href="#/preview/${esc(p.slug)}"${p.slug === active ? ' aria-current="page"' : ""}>${esc(p.slug)}</a>`
    )
    .join("");
  const current = pages.find((p) => p.slug === active) ?? pages[0];
  const options = invalidCodes
    .map((c) => `<option value="${esc(c)}"${c === invalidCode ? " selected" : ""}>${esc(c)}</option>`)
    .join("");
  return `<div class="stack"><h1>Preview del bundle golden</h1><p class="lead">Render de <code>fixtures/golden/clinica-dental-sur</code> con los componentes reales.</p><nav class="cluster" aria-label="Páginas">${tabs}</nav><article class="card"><div class="stack">${current ? current.html : renderByType("text-block", { content: "Sin página", variant: "body" })}</div></article><h2>Fixtures inválidas</h2><p class="caption">Selector informativo: el validador CLI emite el código esperado. La GUI no rompe, muestra el aviso.</p><form class="cluster" id="invalid-picker"><label for="invalid-code">Código</label><select id="invalid-code" name="code">${options}</select><output id="invalid-out" aria-live="polite">${invalidCode ? `El fixture <code>${esc(invalidCode)}</code> dispara <code>[${esc(invalidCode)}]</code> en <code>webconfig validate</code>.` : "Elige un código para ver el mensaje esperado."}</output></form></div>`;
}
