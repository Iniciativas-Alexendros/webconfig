# Arquitectura de webconfig

### Propósito de este documento

- **Objetivos:** Describir capas, fronteras de módulos y no-objetivos de la CLI para que un cambio no rompa el formato congelado ni el determinismo de `export` / `integrity`.
- **Estructura:** Propósito del producto → capas → módulos `src/` → contratos de versión → calidad → no-objetivos → stack.
- **Contenido a integrar según contexto:** Adapta módulos y stack de este repo. No copies tokens OKLCH, Showcase ni `dist-tokens/` a la arquitectura de otro paquete público. No metas tokens dentro del bundle (rompe determinismo). `schemas/` solo se mueve con ADR.

CLI que **crea, valida, normaliza y exporta** paquetes `site.bundle v1.0.0` para que un generador o un LLM produzca sitios sin desviarse del formato.

El [README.md](./README.md) cubre el uso. Las decisiones viven en [`docs/architecture/decisions/`](./docs/architecture/decisions/). Este documento describe capas, fronteras y lo que no se toca.

## 1. Propósito

Entrada: un directorio o un `.tar.gz` con manifiesto, composición, contenido i18n, SEO y assets.  
Salida: informe de validación (humano o JSON), archivos canónicos, o un tarball reproducible.

Flujo: `init` → `validate` → `normalize` → `export` → `integrity`.

## 2. Capas

```
Consumidor (humano, CI, LLM)
        │  CLI (commander)
        ▼
src/cli.ts
  init.ts          scaffold starter
  validate/        sintaxis AJV + semántica
  normalize.ts     YAML/JSON canónicos
  export/bundler   tar.gz determinista
  integrity.ts     SHA-256 por fichero + hash global
        │
        ▼
schemas/  (draft-2020-12, congelados en v1.0.0)
tokens/   (DTCG → dist-tokens/; contrato en tokens/CONTRACT.md; no forman parte del bundle)
landing/  (React + shadcn; build estático junto al Showcase)
showcase/ (Vite + React + shadcn; tokens, componentes y validación AJV; no runtime de la CLI)
```

## 3. Módulos (`src/`)

| Módulo                   | Responsabilidad                                                 |
| ------------------------ | --------------------------------------------------------------- |
| `cli.ts`                 | Comandos `init`, `validate`, `normalize`, `export`, `integrity` |
| `init.ts`                | Starter válido + `ds-catalog.yaml` mínimo si falta              |
| `load.ts`                | Carga directorio o `.tar.gz` (fail-closed)                      |
| `validate/syntax.ts`     | AJV draft-2020-12                                               |
| `validate/semantic.ts`   | Reglas `*_NNN` (padres, refs, i18n, a11y, secretos…)            |
| `validate/ds-catalog.ts` | Catálogo genérico; `category` decide layout                     |
| `canonicalize.ts`        | Orden de claves, indentación 2, LF                              |
| `export/bundler.ts`      | tar + gzip sin timestamps; uid/gid 0                            |
| `integrity.ts`           | Hashes; `manifest.yaml` excluido del conjunto                   |

El Design System (tokens OKLCH + Showcase) es **opt-in** y no cambia `schemas/` hasta que se apruebe [0001](docs/architecture/decisions/0001-ds-tokens-v1.1-proposal.md).

## 4. Contratos de versión

| Qué         | Dónde                        | Quién la mueve             |
| ----------- | ---------------------------- | -------------------------- |
| Herramienta | `package.json` → `version`   | semantic-release           |
| Formato     | `schemas/` + `schema_compat` | Solo decisión manual + ADR |

Release = tag + GitHub Release (`npmPublish: false`). Sin push de `@semantic-release/git` a `main` (GH006 / branch protection). Los workflows `release.yml` y `release-validation.yml` no forman parte del pipeline `quality/test/build/smoke`.

## 5. Calidad

- Vitest sobre `tests/**/*.test.ts` con umbrales 80/75/80/80 (flota ≥ 70 %)
- Fixtures `fixtures/invalid/<CODE>/` 1:1 con la tabla de códigos
- Playwright sobre el Showcase (`tests/ds/*.e2e.spec.ts`)
- CI: `quality` (typecheck, lint, format, tokens, audit) → `test` (cobertura + fixtures, Node 20/22) → `build` (CLI + tokens + showcase, artefacto `dist/`) → `smoke` (CLI sobre golden + Playwright)

## 6. No-objetivos

- No reescribir la API/UX de la CLI en PRs de plataforma
- No publicar a npm
- No red en el runtime del validador
- No secretos en el repo ni en bundles de ejemplo

## 7. Stack

TypeScript 5.3 strict · Node ≥ 20.10 · ESM · npm · Vitest · Playwright · tsup · AJV 2020-12 · yaml · commander · tar-stream.
