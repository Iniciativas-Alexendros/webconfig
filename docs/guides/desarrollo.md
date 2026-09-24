# Guía: desarrollo local

## Requisitos

- Node.js ≥ 20.10 (`nvm use` lee `.nvmrc` → 22)
- npm (el lockfile es `package-lock.json`; no uses pnpm en este repo)

## Arranque

```bash
nvm use
npm ci
npm run build
node dist/cli.js init ./mi-sitio --name "Mi Sitio"
node dist/cli.js validate ./mi-sitio --ds ./ds-catalog.yaml
```

La CLI no requiere variables de entorno. `process.env.CI` solo lo usa Playwright para reintentos y no reutilizar el servidor Vite.

## Antes de abrir un PR

```bash
npm run typecheck:all && npm run lint && npm run format:check
npm run build && npm test && npm run verify:fixtures
npm run tokens:build && npm run tokens:check && npx playwright test && npm run ds:build
```

Hooks husky: Conventional Commits, lint-staged en pre-commit, typecheck+lint en pre-push. Los commits `chore(release):` de semantic-release están en la ignore list de commitlint.

## Dónde documentar

| Cambio                                   | Documento                             |
| ---------------------------------------- | ------------------------------------- |
| Comando o flag CLI                       | `README.md`                           |
| `schemas/`, códigos, contrato de formato | ADR en `docs/architecture/decisions/` |
| Tokens / Showcase                        | `docs/guides/design-system.md`        |
| Fallo operativo                          | runbook en `docs/runbooks/`           |
