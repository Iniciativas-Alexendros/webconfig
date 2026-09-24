# Runbook: CI y release

## Jobs `quality` / `test` / `smoke` en rojo

1. Reproduce en local los comandos del [job](../guides/calidad.md).
2. `quality` + format: `npm run format` y vuelve a `format:check`.
3. `quality` + tokens: `npm run tokens:build` y commitea `dist-tokens/` si el drift es legítimo.
4. `test` + coverage: no bajes umbrales; añade tests o reduce código muerto.
5. `smoke` + Playwright: baseline en `tests/ds/showcase.e2e.spec.ts-snapshots/`; actualiza solo con `npm run e2e:update` y revisión visual.
6. `smoke` + export no determinista: comprueba que no hay timestamps ni orden de claves distinto (`normalize --write`).

No hagas force-push para “arreglar” CI. No toques `release.yml` ni `.releaserc.json` en un PR de plataforma.

## Release (semantic-release)

- Disparo: push a `main` / `beta` / `alpha` con Conventional Commits.
- Paquete `private: true` → tag + GitHub Release, **sin** publicar a npm.
- Commit generado: `chore(release): x.y.z [skip ci]` (commitlint lo ignora).
- Secretos esperados: `GITHUB_TOKEN` del workflow. No hace falta `NPM_TOKEN`.
- Tras publicar, `release-validation.yml` valida golden, fixtures inválidas, determinismo y que el tag coincide con `package.json`.

Si el release no recorta versión: el commit no es `feat`/`fix` (o breaking). No edites `CHANGELOG.md` a mano.

## Renovate

Configuración en `.github/renovate.json` (managers `npm` y `github-actions`). No hay Dependabot de version-updates. PRs de major van con label `breaking-change` y sin automerge.
