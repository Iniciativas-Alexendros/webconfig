import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThemeCycleButton } from "@/components/theme-toggle";
import { registry, renderByType } from "@/lib/registry";
import { parseCompositionYaml } from "@/lib/yaml";
import { exampleBundleMap } from "@/lib/example-bundle";
import { bundleMapFromRelativePaths } from "@/lib/bundle-files";
import { validateSyntaxDocuments } from "../../src/validate/syntax-documents.js";

declare const __GOLDEN__: Record<string, string>;
declare const __TOKENS__: { light: Record<string, string>; dark: Record<string, string> };
declare const __HEX__: { light: Record<string, string>; dark: Record<string, string> };
declare const __INVALID__: string[];

type Route = { kind: "tokens" } | { kind: "componentes" } | { kind: "preview"; slug: string } | { kind: "validar" };

function parseHash(): Route {
  const hash = location.hash || "#/";
  const previewMatch = hash.match(/^#\/preview\/([A-Za-z0-9-]+)/);
  if (hash.startsWith("#/componentes")) return { kind: "componentes" };
  if (hash.startsWith("#/validar")) return { kind: "validar" };
  if (hash.startsWith("#/preview")) return { kind: "preview", slug: previewMatch?.[1] ?? "home" };
  return { kind: "tokens" };
}

function HtmlBlock({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function TokensPage() {
  const rows = useMemo(() => {
    const names = Object.keys(__TOKENS__.light).sort();
    return names.map((n) => ({
      name: n,
      light: __TOKENS__.light[n] as string,
      dark: (__TOKENS__.dark[n] as string) ?? (__TOKENS__.light[n] as string),
      hex: (__HEX__.light[n] as string) ?? "",
    }));
  }, []);

  return (
    <div className="stack space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Tokens del Design System</h1>
      <p className="lead text-[var(--muted-foreground)]">
        Fuente OKLCH (W3C DTCG). Cambia el tema para ver light/dark.
      </p>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead>Valor light</TableHead>
                <TableHead>Muestra</TableHead>
                <TableHead>Fallback hex</TableHead>
                <TableHead>Valor dark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.name}>
                  <TableCell>
                    <code>{t.name}</code>
                  </TableCell>
                  <TableCell>
                    <code>{t.light}</code>
                  </TableCell>
                  <TableCell>
                    <span
                      className="swatch"
                      style={{ background: t.hex || t.light }}
                      role="img"
                      aria-label={`Muestra ${t.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <code>{t.hex}</code>
                  </TableCell>
                  <TableCell>
                    <code>{t.dark}</code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ComponentesPage() {
  return (
    <div className="stack space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Componentes ({registry.length}/18)</h1>
      <p className="lead text-[var(--muted-foreground)]">
        Render 1:1 con <code>ds-catalog.example.yaml</code>.
      </p>
      <div className="grid-auto">
        {registry.map((c) => {
          let html: string;
          try {
            html = c.render(c.sample as never);
          } catch {
            html = `<div class="badge" data-tone="danger">Error al renderizar ${c.id}</div>`;
          }
          return (
            <Card key={c.id} data-component={c.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{c.category}</Badge>
                  <code className="text-sm">{c.id}</code>
                </div>
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="preview">
                  <HtmlBlock html={html} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PreviewPage({ slug, invalidCodes }: { slug: string; invalidCodes: string[] }) {
  const pages = useMemo(() => {
    return ["home", "servicios", "contacto"].map((pageSlug) => {
      const raw = __GOLDEN__?.[pageSlug] ?? "";
      try {
        const parsed = parseCompositionYaml(raw);
        const html = parsed.components
          .map((c) => {
            try {
              return renderByType(c.type, c.props);
            } catch {
              return `<div class="badge" data-tone="danger">Error en ${c.id}</div>`;
            }
          })
          .join("\n");
        return { slug: pageSlug, html };
      } catch {
        return {
          slug: pageSlug,
          html: renderByType("text-block", { content: `No se pudo parsear ${pageSlug}`, variant: "body" }),
        };
      }
    });
  }, []);

  const current = pages.find((p) => p.slug === slug) ?? pages[0];
  const [invalidCode, setInvalidCode] = useState("");

  return (
    <div className="stack space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Preview del bundle golden</h1>
      <p className="lead text-[var(--muted-foreground)]">
        Render de <code>fixtures/golden/clinica-dental-sur</code> con los componentes reales.
      </p>
      <nav className="cluster flex flex-wrap gap-2" aria-label="Páginas">
        {pages.map((p) => (
          <Button key={p.slug} asChild variant={p.slug === slug ? "default" : "secondary"}>
            <a href={`#/preview/${p.slug}`} aria-current={p.slug === slug ? "page" : undefined}>
              {p.slug}
            </a>
          </Button>
        ))}
      </nav>
      <Card>
        <CardContent className="stack space-y-4 pt-6">
          <HtmlBlock html={current?.html ?? renderByType("text-block", { content: "Sin página", variant: "body" })} />
        </CardContent>
      </Card>
      <h2 className="text-2xl font-semibold">Fixtures inválidas</h2>
      <p className="caption text-sm text-[var(--muted-foreground)]">
        Selector informativo: el validador CLI emite el código esperado. La GUI no rompe, muestra el aviso.
      </p>
      <form
        className="cluster flex flex-wrap items-center gap-3"
        id="invalid-picker"
        onSubmit={(e) => e.preventDefault()}
      >
        <Label htmlFor="invalid-code">Código</Label>
        <select
          id="invalid-code"
          name="code"
          className="h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input-bg)] px-3"
          value={invalidCode}
          onChange={(e) => setInvalidCode(e.target.value)}
        >
          <option value="">—</option>
          {invalidCodes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <output id="invalid-out" aria-live="polite" className="text-sm">
          {invalidCode
            ? `El fixture ${invalidCode} dispara [${invalidCode}] en webconfig validate.`
            : "Elige un código para ver el mensaje esperado."}
        </output>
      </form>
    </div>
  );
}

interface IssueView {
  code: string;
  severity: string;
  file: string;
  message: string;
}

function ValidatePage() {
  const [sourceLabel, setSourceLabel] = useState("ejemplo local");
  const [issues, setIssues] = useState<IssueView[]>([]);

  const run = useCallback((files: ReadonlyMap<string, string>, label: string) => {
    const next = validateSyntaxDocuments(files).map((issue) => ({
      code: issue.code,
      severity: issue.severity,
      file: issue.file,
      message: issue.message,
    }));
    setSourceLabel(label);
    setIssues(next);
  }, []);

  useEffect(() => {
    run(exampleBundleMap(), "ejemplo local");
  }, [run]);

  const errors = issues.filter((i) => i.severity === "error");
  const ok = errors.length === 0;

  return (
    <div className="stack space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Validar bundle</h1>
      <p className="lead text-[var(--muted-foreground)]">
        Abre una carpeta <code>site.bundle</code> desde tu disco. La comprobación de esquema (AJV) corre en el
        navegador, sin servidor. Si no eliges archivos, se usa el ejemplo local.
      </p>
      <p className="caption text-sm text-[var(--muted-foreground)]">
        La validación semántica, el export <code>.tar.gz</code> y la CLI siguen en Node.
      </p>
      <form className="cluster flex flex-wrap items-end gap-3" id="bundle-form" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="bundle-files">Carpeta del bundle</Label>
          <Input
            id="bundle-files"
            name="bundle"
            type="file"
            multiple
            ref={(el) => {
              if (el) el.setAttribute("webkitdirectory", "");
            }}
            onChange={(e) => {
              const list = e.target.files;
              if (!list || list.length === 0) {
                run(exampleBundleMap(), "ejemplo local");
                return;
              }
              void (async () => {
                const entries = await Promise.all(
                  [...list].map(async (file) => {
                    const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
                    return { path: relative, text: await file.text() };
                  })
                );
                const map = bundleMapFromRelativePaths(entries);
                const label = map.size === 0 ? "ejemplo local" : "archivos locales";
                run(map.size === 0 ? exampleBundleMap() : map, label);
              })();
            }}
          />
        </div>
        <Button
          id="bundle-example"
          type="button"
          variant="secondary"
          onClick={() => run(exampleBundleMap(), "ejemplo local")}
        >
          Usar ejemplo local
        </Button>
      </form>
      <p>
        Fuente: <strong id="validation-source">{sourceLabel}</strong>
      </p>
      <p id="validation-status">
        {ok ? (
          <Badge variant="success">Esquema válido</Badge>
        ) : (
          <Badge variant="danger">
            Esquema con {errors.length} error{errors.length === 1 ? "" : "es"}
          </Badge>
        )}
      </p>
      {issues.length === 0 ? (
        <p>Ningún error de esquema AJV.</p>
      ) : (
        <ul className="stack list-disc space-y-2 pl-5">
          {issues.map((issue, i) => (
            <li key={`${issue.code}-${issue.file}-${i}`}>
              <code>{issue.code}</code> <code>{issue.file}</code> — {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ShowcaseApp() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const nav = (
    <nav className="flex flex-wrap gap-2" aria-label="Showcase">
      <Button asChild variant={route.kind === "tokens" ? "default" : "secondary"}>
        <a href="#/">Tokens</a>
      </Button>
      <Button asChild variant={route.kind === "componentes" ? "default" : "secondary"}>
        <a href="#/componentes">Componentes</a>
      </Button>
      <Button asChild variant={route.kind === "preview" ? "default" : "secondary"}>
        <a href="#/preview/home">Preview</a>
      </Button>
      <Button asChild variant={route.kind === "validar" ? "default" : "secondary"}>
        <a href="#/validar">Validar</a>
      </Button>
    </nav>
  );

  return (
    <div className="ds-shell">
      <header className="ds-header">
        <div className="ds-header-inner">
          <strong>webconfig DS</strong>
          {nav}
          <span className="flex-1" />
          <ThemeCycleButton locale="en" />
        </div>
      </header>
      <main className="ds-main" id="app" aria-live="polite">
        {route.kind === "tokens" && <TokensPage />}
        {route.kind === "componentes" && <ComponentesPage />}
        {route.kind === "preview" && <PreviewPage slug={route.slug} invalidCodes={__INVALID__} />}
        {route.kind === "validar" && <ValidatePage />}
      </main>
      <footer className="ds-footer">webconfig Design System · OKLCH · W3C DTCG · WCAG 2.2 AA</footer>
    </div>
  );
}
