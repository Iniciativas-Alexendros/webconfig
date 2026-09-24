# Guía: calidad y cobertura

### Propósito de este documento

- **Objetivos:** Fijar umbrales de cobertura, el contrato de fixtures y el significado de los jobs `quality` / `test` / `build` / `smoke`.
- **Estructura:** Gate de cobertura → fixtures golden/inválidas → tabla de jobs del pipeline principal (release queda aparte).
- **Contenido a integrar según contexto:** Adapta umbrales (este repo 80/75/80/80; flota ≥ 70 %). No copies gates de otro paquete público. El job `quality` incluye `tokens:check`; no bajes coverage para “arreglar” drift de tokens ni regeneres fixtures inválidas.

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
