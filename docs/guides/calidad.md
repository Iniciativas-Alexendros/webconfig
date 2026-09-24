# Guía: calidad y cobertura

## Gate de cobertura

Vitest (`vitest.config.ts`) exige:

| Métrica    | Umbral en repo | Mínimo de flota |
| ---------- | -------------- | --------------- |
| statements | 80 %           | 70 %            |
| branches   | 75 %           | 70 %            |
| functions  | 80 %           | 70 %            |
| lines      | 80 %           | 70 %            |

`npm test -- --coverage` (job `test`) falla si bajas de esos umbrales. No bajes el gate por debajo del 70 % de flota.

## Fixtures

- Golden: `fixtures/golden/clinica-dental-sur/`
- Inválidas: `fixtures/invalid/<CODE>/` (una por código). Son canónicas; no las regeneres con scripts obsoletos.
- `npm run verify:fixtures` comprueba cobertura 1:1 código ↔ carpeta.

## Jobs del pipeline principal

| Job       | Qué hace                                                             |
| --------- | -------------------------------------------------------------------- |
| `quality` | typecheck, lint, format, tokens:check, `npm audit` (high, solo prod) |
| `test`    | Vitest + coverage, fixtures, validate golden `--json` (Node 20 y 22) |
| `build`   | tokens + CLI + showcase; sube artefacto `dist/`                      |
| `smoke`   | `--help`, validate/normalize/export del golden, Playwright           |

`release.yml` y `release-validation.yml` siguen aparte y no se renombran.
