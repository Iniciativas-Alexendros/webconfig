import { esc } from "../lib/render.js";

export interface ValidateIssueView {
  code: string;
  severity: string;
  file: string;
  message: string;
}

export function ValidateView(input: { sourceLabel: string; issues: ValidateIssueView[] }): string {
  const errors = input.issues.filter((issue) => issue.severity === "error");
  const ok = errors.length === 0;
  const status = ok
    ? `<p id="validation-status" class="badge" data-tone="success">Esquema válido</p>`
    : `<p id="validation-status" class="badge" data-tone="danger">Esquema con ${errors.length} error${errors.length === 1 ? "" : "es"}</p>`;
  const list =
    input.issues.length === 0
      ? `<p>Ningún error de esquema AJV.</p>`
      : `<ul class="stack">${input.issues
          .map(
            (issue) =>
              `<li><code>${esc(issue.code)}</code> <code>${esc(issue.file)}</code> — ${esc(issue.message)}</li>`
          )
          .join("")}</ul>`;
  return `<div class="stack"><h1>Validar bundle</h1><p class="lead">Abre una carpeta <code>site.bundle</code> desde tu disco. La comprobación de esquema (AJV) corre en el navegador, sin servidor. Si no eliges archivos, se usa el ejemplo local.</p><p class="caption">La validación semántica, el export <code>.tar.gz</code> y la CLI siguen en Node.</p><form class="cluster" id="bundle-form"><label for="bundle-files">Carpeta del bundle</label><input id="bundle-files" name="bundle" type="file" webkitdirectory multiple /><button class="btn" data-variant="secondary" id="bundle-example" type="button">Usar ejemplo local</button></form><p>Fuente: <strong id="validation-source">${esc(input.sourceLabel)}</strong></p>${status}${list}</div>`;
}
