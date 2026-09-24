# Guía: Design System

Fuente: `tokens/*.tokens.json` (W3C DTCG, color OKLCH). El formato `site.bundle v1.0.0` **no** cambia; la extensión `theme.tokensRef` está propuesta en [0001](../architecture/decisions/0001-ds-tokens-v1.1-proposal.md).

## Comandos

| Script                 | Efecto                                                      |
| ---------------------- | ----------------------------------------------------------- |
| `npm run tokens:build` | Genera `dist-tokens/{css,ts,json}` y copia CSS al Showcase  |
| `npm run tokens:check` | Contraste WCAG 2.2 AA + APCA y cobertura 1:1                |
| `npm run ds:dev`       | Showcase en Vite (`/`, `/#/componentes`, `/#/preview/home`) |
| `npm run ds:build`     | Build estático `dist-showcase/`                             |
| `npx playwright test`  | E2E + capturas light/dark                                   |

## Contrato

- `dist-tokens/` va commiteado. El job `build` falla si regenerar tokens produce drift.
- El catálogo de 18 componentes de ejemplo es `ds-catalog.example.yaml`. `init` escribe un mínimo de 4 si no existe `ds-catalog.yaml`.
- No metas tokens dentro del bundle: rompe determinismo de `export` / `integrity`.
