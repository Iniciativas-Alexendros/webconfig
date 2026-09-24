# Runbook: validación y exportación de bundles

### Propósito de este documento

- **Objetivos:** Diagnosticar fallos habituales de `validate`, `normalize`, `export` e `integrity` sobre un `site.bundle`.
- **Estructura:** Catálogo ausente (`COMP_001`) → warnings vs `--strict` → JSON fail-closed → normalize → export no bit-idéntico → integridad → secretos.
- **Contenido a integrar según contexto:** Adapta códigos y rutas de esta CLI. No copies runbooks de otro paquete público. El DS catalog (`--ds`) no viaja dentro del bundle; no incrustes tokens ni claves reales en fixtures.

## `validate` falla con `COMP_001`

Causa habitual: no encuentra `ds-catalog.yaml`. Pasa `--ds` explícito o coloca el catálogo en el directorio padre del paquete.

```bash
node dist/cli.js validate ./mi-sitio --ds ./ds-catalog.yaml
```

## Avisos que no fallan

`I18N_002`, `ASSET_002`, `SEO_002`, `CRYPTO_001` son warnings. Usa `--strict` para tratarlos como error (salida 1).

## `validate --json` ante un paquete inexistente

Fail-closed: JSON en stdout con `valid: false` y `SYNTAX_ERROR`. No busques el error solo en stderr.

## `normalize --check` rojo en CI

Los YAML/JSON no están canónicos. En local:

```bash
node dist/cli.js normalize ./mi-sitio --write
```

Commitea el resultado. Indentación 2, LF, claves ordenadas.

## Export no bit-idéntico

Dos `export` del mismo árbol deben producir el mismo SHA-256. Si no:

- hay ficheros no canónicos
- o se están incluyendo mtimes / uid distintos (bug en `src/export/bundler.ts`)

## Integridad

`integrity` hashea todos los ficheros **excepto** `manifest.yaml`. Un mismatch es `INTEGRITY_001` (fichero) o `INTEGRITY_002` (global).

## Secretos

`SECRET_001` (error) y `CRYPTO_001` (aviso). No uses fixtures con claves reales. Reporta fugas por [SECURITY.md](../../SECURITY.md), no por issue público.
