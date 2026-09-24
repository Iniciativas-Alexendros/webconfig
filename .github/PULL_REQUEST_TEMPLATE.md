<!-- canon-managed: true -->

### Propósito de este documento

- **Objetivos:** Plantilla de PR para describir el cambio y exigir las comprobaciones de calidad, tests, golden y jobs `quality` / `test` / `smoke`.
- **Estructura:** Qué cambia → checklist (typecheck/lint, build/test/fixtures, validate/normalize, docs, artefactos, CI).
- **Contenido a integrar según contexto:** Adapta el checklist a los scripts de esta CLI. No copies plantillas de otro paquete público. Si el PR toca tokens/DS, actualiza `docs/guides/design-system.md` y commitea `dist-tokens/`; no metas tokens en el bundle.

## Qué cambia

<!-- feat/fix/docs + alcance en una o dos frases -->

## Checklist

- [ ] `npm run typecheck:all && npm run lint && npm run format:check`
- [ ] `npm run build && npm test && npm run verify:fixtures`
- [ ] `validate` + `normalize --check` del golden en verde
- [ ] Docs actualizadas (`README.md` y `docs/architecture/decisions/` si toca `schemas/`, códigos o comandos)
- [ ] Sin artefactos (`dist/`, `coverage/`, `*.tar.gz`) ni secretos
- [ ] CI `quality` / `test` / `smoke` en verde
