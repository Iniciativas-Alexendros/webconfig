# AGENTS.md

**Destinatarios:** agentes de código y el rol Mantenedor que trabajen en este repositorio.  
**Propósito:** contrato operativo. Homogeneizamos **nombres y contratos**, no el lenguaje ni la API del producto.

## Fuentes de verdad (orden)

1. [README.md](./README.md) — uso de la CLI y códigos de error
2. Este archivo
3. [ARCHITECTURE.md](./ARCHITECTURE.md)
4. [docs/architecture/decisions/](./docs/architecture/decisions/) — ADRs; el stub [`DECISIONS.md`](./DECISIONS.md) apunta aquí
5. [CONTRIBUTING.md](./CONTRIBUTING.md)
6. [SECURITY.md](./SECURITY.md)

No reinventes requisitos. Si falta ancla, paras y preguntas.

## Unidad de trabajo

```
Objetivo: <resultado verificable>
Traza: <ADR / issue / código de error>
Alcance: <archivos>
Exclusiones: <qué no harás>
Pruebas: npm test / npm run verify:fixtures / npx playwright test
Criterio de cierre: CI quality + test + smoke verdes
```

Una sesión = una unidad cohesiva. PR pequeño. Mensajes al humano y commits en español (Conventional Commits).

## Autonomía

**Puedes sin preguntar**

- Tests que fijan comportamiento ya aceptado
- Corregir lint/format/typecheck causados por tu cambio
- Docs de guía/runbook en español
- Refactors locales que no cambien la CLI pública ni `schemas/`

**Requiere confirmación**

- Tocar `schemas/`, `schema_compat` o la tabla de códigos → ADR previo
- Dependencia runtime nueva (lista congelada: `yaml`, `ajv`, `ajv-formats`, `commander`, `tar-stream`)
- Cambiar semantic-release, husky o los workflows `release.yml` / `release-validation.yml`
- Publicar tags (lo hace semantic-release en `main`)

## Stack y comandos

- Node ≥ 20.10 (`.nvmrc` = 22), npm, TypeScript ESM, Vitest, Playwright, tsup
- Coverage gate (Vitest): statements/functions/lines **80%**, branches **75%** — por encima del mínimo de flota **≥ 70%**

```bash
nvm use && npm ci
npm run typecheck:all && npm run lint && npm run format:check
npm run build && npm test && npm run verify:fixtures
npm run tokens:build && npm run tokens:check
npx playwright test && npm run ds:build
node dist/cli.js validate fixtures/golden/clinica-dental-sur --ds ds-catalog.example.yaml
```

CI principal (`.github/workflows/ci.yml`): jobs `quality`, `test`, `build`, `smoke`. Release queda en workflows aparte.

## Convenciones

- Ramas `feat/` `fix/` `docs/` `chore/` (los agentes Cloud usan `cursor/…`)
- Hooks husky: commitlint (Conventional Commits; ignora `chore(release):`), lint-staged en pre-commit, `typecheck:all + lint` en pre-push
- Idioma: README/CONTRIBUTING/docs de guía en español; el registro histórico de decisiones permanece en inglés
- Fixtures inválidas en disco son canónicas; no las regeneres con scripts obsoletos
- No commitees `dist/`, `coverage/`, `*.tar.gz` ni secretos

## Layout

```
src/            CLI + validador + export/integrity
schemas/        Formato site.bundle v1.0.0 (congelado)
tokens/         DTCG OKLCH → dist-tokens/
showcase/       GUI del design system (Vite)
fixtures/       golden + invalid/<CODE>
tests/          Vitest + Playwright (tests/ds/*.e2e.spec.ts)
docs/           architecture/, guides/, runbooks/
```

## Definition of Done

- Criterios de la traza cumplidos
- Jobs `quality`, `test` y `smoke` verdes
- Docs canónicos actualizados si cambia el contrato
- Sin secretos en el diff
