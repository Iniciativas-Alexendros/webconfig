# Guía: Design System

### Propósito de este documento

- **Objetivos:** Explicar cómo construir, comprobar y previsualizar los tokens OKLCH (DTCG) y el Showcase sin alterar el formato `site.bundle v1.0.0`.
- **Estructura:** Fuente y propuesta 0001 → tabla de comandos → contrato (`dist-tokens/` commiteado, catálogo, tokens fuera del bundle).
- **Contenido a integrar según contexto:** Adapta scripts y rutas de este repo. No copies `tokens/*.tokens.json`, `dist-tokens/` ni el catálogo de 18 componentes a otro paquete público. No metas tokens dentro del bundle (rompe `export` / `integrity`). La extensión `theme.tokensRef` no se implementa hasta aprobar [0001](../architecture/decisions/0001-ds-tokens-v1.1-proposal.md).

Fuente: `tokens/*.tokens.json` (W3C DTCG, color OKLCH). Contrato v1.0: [`tokens/CONTRACT.md`](../../tokens/CONTRACT.md) y [`tokens/contract.schema.json`](../../tokens/contract.schema.json). El formato `site.bundle v1.0.0` **no** cambia; la extensión `theme.tokensRef` está propuesta en [0001](../architecture/decisions/0001-ds-tokens-v1.1-proposal.md). La landing estática está en `landing/` y la vista `#/validar` del Showcase comprueba el esquema AJV en el navegador.

## Comandos

| Script                 | Efecto                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| `npm run tokens:build` | Genera `dist-tokens/{css,ts,json}` y copia CSS al Showcase                |
| `npm run tokens:check` | Contraste WCAG 2.2 AA + APCA y cobertura 1:1                              |
| `npm run ds:dev`       | Showcase en Vite (`/`, `/#/componentes`, `/#/preview/home`, `/#/validar`) |
| `npm run ds:build`     | Build estático `dist-showcase/`                                           |
| `npx playwright test`  | E2E + capturas light/dark                                                 |

## Contrato

- `dist-tokens/` va commiteado. El job `build` falla si regenerar tokens produce drift.
- El hex de `fallback-hex.json` y de `@supports` no se usa para pintar UI. La UI nueva referencia variables CSS.
- `landing/index.html` se sirve como HTML estático y consume `dist-tokens/css/variables.css`.
- El catálogo de 18 componentes de ejemplo es `ds-catalog.example.yaml`. `init` escribe un mínimo de 4 si no existe `ds-catalog.yaml`.
- No metas tokens dentro del bundle: rompe determinismo de `export` / `integrity`.
