# Contribuir a webconfig

### Propósito de este documento

- **Objetivos:** Explicar setup, flujo de rama/PR y reglas locales para contribuir sin romper contratos, fixtures ni el Design System opt-in.
- **Estructura:** Idioma → setup → flujo de trabajo → comprobaciones antes del PR → reglas (schemas, coverage, fixtures, artefactos, seguridad).
- **Contenido a integrar según contexto:** Adapta scripts npm, hooks husky y umbrales de este repo. No copies un flujo pnpm/monorepo ni tokens de otro paquete público. Si hay drift de tokens, commitea `dist-tokens/`; no metas tokens dentro del bundle.

Idioma: este fichero en español, `README.md` y `docs/guides|runbooks` en español. El registro histórico de decisiones permanece en inglés. No re-traducir sin motivo.

Lee también [AGENTS.md](AGENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md) y [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Setup

```bash
nvm use && npm ci
```

## Flujo de trabajo

Rama `feat/*` / `fix/*` / `docs/*` / `chore/*` → PR → squash → merge a `main` → release automática (semantic-release, Conventional Commits).

Los hooks `husky` exigen mensajes convencionales (`feat:`, `fix:`, `docs:`, …) y corren `lint-staged` en pre-commit y `typecheck:all + lint` en pre-push.

## Antes de un PR

```bash
npm run typecheck:all && npm run lint && npm run format:check
npm run build && npm test && npm run verify:fixtures
npm run tokens:build && npm run tokens:check && npx playwright test && npm run ds:build
node dist/cli.js validate fixtures/golden/clinica-dental-sur --ds ./ds-catalog.yaml
node dist/cli.js normalize fixtures/golden/clinica-dental-sur --check
```

Comandos del Design System: `tokens:build` (genera `dist-tokens/` + copia del showcase), `tokens:check` (contraste + cobertura), `verify:ds` (cobertura 1:1), `ds:dev` (showcase local), `ds:build` (build estático `dist-showcase/`), `e2e` (Playwright).

## Reglas

- Tocar `schemas/` o la tabla de códigos → propuesta previa en [`docs/architecture/decisions/`](docs/architecture/decisions/).
- Coverage: Vitest exige ≥ 80 % statements/functions/lines y ≥ 75 % branches (mínimo de flota ≥ 70 %). Documentado en [`docs/guides/calidad.md`](docs/guides/calidad.md).
- No regenerar `fixtures/invalid/` con `scripts/create-invalid-fixtures.sh` (obsoleto, ver cabecera del script). Las fixtures en disco son canónicas.
- No commitear `dist/`, `coverage/`, `*.tar.gz` ni ficheros de estado (`findings.md`, `progress.md`, `task_plan.md`).
- Nuevos comandos CLI → documentar en `README.md` (tabla + sección + ejemplo) y ADR en `docs/architecture/decisions/` en el mismo PR.
- Vulnerabilidades: [SECURITY.md](SECURITY.md), no un issue público.
