# Contribuir a webconfig

Idioma: este fichero en español, `README.md` en español, `DECISIONS.md` en inglés. No re-traducir sin motivo.

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
node dist/cli.js validate fixtures/golden/clinica-dental-sur --ds ./ds-catalog.yaml
node dist/cli.js normalize fixtures/golden/clinica-dental-sur --check
```

## Reglas

- Tocar `schemas/` o la tabla de códigos → propuesta previa en `DECISIONS.md`.
- No regenerar `fixtures/invalid/` con `scripts/create-invalid-fixtures.sh` (obsoleto, ver cabecera del script). Las fixtures en disco son canónicas.
- No commitear `dist/`, `coverage/`, `*.tar.gz` ni ficheros de estado (`findings.md`, `progress.md`, `task_plan.md`).
- Nuevos comandos CLI → documentar en `README.md` (tabla + sección + ejemplo) y ADR en `DECISIONS.md` en el mismo PR.
