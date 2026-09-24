<!-- canon-managed: true -->

## Qué cambia

<!-- feat/fix/docs + alcance en una o dos frases -->

## Checklist

- [ ] `npm run typecheck:all && npm run lint && npm run format:check`
- [ ] `npm run build && npm test && npm run verify:fixtures`
- [ ] `validate` + `normalize --check` del golden en verde
- [ ] Docs actualizadas (`README.md` y `docs/architecture/decisions/` si toca `schemas/`, códigos o comandos)
- [ ] Sin artefactos (`dist/`, `coverage/`, `*.tar.gz`) ni secretos
- [ ] CI `quality` / `test` / `smoke` en verde
