# ADR: Extensión de theme con tokens del Design System (propuesta v1.1)

- **Fecha**: 2026-09-11
- **Estado**: PROPUESTA (no cambia `schemas/` ni el validador v1.x)
- **Contexto**: `site.bundle v1.0.0` congela `theme` en 3 claves (`colorScheme/fontFamily/radius`, ver `schemas/site-config.schema.json:92-124`). El nuevo Design System (`tokens/*.tokens.json`, formato W3C DTCG, color OKLCH) necesita una referencia opcional desde el bundle sin romper paquetes existentes.
- **Decisión**: extensión opt-in con dos claves opcionales:

```yaml
theme:
  colorScheme: light
  fontFamily: Inter, system-ui, sans-serif
  radius: md
  tokensVersion: "1.0" # opcional, default "1.0"
  tokensRef: "../design-tokens.json" # opcional, externo al bundle
```

- **Reglas**:
  1. `theme` v1.0 (3 claves) sigue siendo válido y requerido. Los paquetes sin `tokensRef` usan los tokens generados de este repo (`dist-tokens/json/tokens.json`) como fallback.
  2. `tokensRef` apunta fuera del bundle (hermano del paquete, como `ds-catalog.yaml`); nunca dentro de `assets/` ni `content/`. El manifiesto `integrity` no lo cubre.
  3. El validador futuro emitirá `DS_001` (warning, nunca error) si `tokensRef` apunta a un fichero inexistente o no-DTCG. Sin cambios en `schemas/` hasta aprobación explícita de esta propuesta.
  4. `radius` v1.0 mapea a `radius.{none,sm,md,lg,full}` del DS; `fontFamily` v1.0 mapea a `font.sans`; `colorScheme` v1.0 mapea a `data-theme` / `prefers-color-scheme`.
- **Consecuencias**: cero cambios de formato en v1.0.x; la GUI Showcase (`showcase/`) ya consume estos tokens; cuando la propuesta se apruebe, se versionará `schemas/site-config.schema.json` a 1.1 con `tokensVersion/tokensRef` opcionales.
- **Alternativas descartadas**: meter tokens dentro del bundle (rompe determinismo de `export`/`integrity`); hacer `tokensRef` requerido (rompe compatibilidad con el golden actual).
