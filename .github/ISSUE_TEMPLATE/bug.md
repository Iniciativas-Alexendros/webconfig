---
name: Bug
description: Comportamiento incorrecto de webconfig
---

### Propósito de este documento

- **Objetivos:** Recoger un fallo reproducible de la CLI (comando, esperado vs obtenido, entorno) sin filtrar secretos.
- **Estructura:** Comando y salida → esperado vs obtenido → reproducción → entorno.
- **Contenido a integrar según contexto:** Adapta el formulario a webconfig. No copies plantillas de otro paquete público. Adjunta un bundle mínimo sintético; no pegues tokens, `.env` ni claves. El DS catalog se pasa con `--ds`, no dentro del bundle.

## Comando y salida

```bash
# comando ejecutado + salida relevante (códigos [XXX_NNN], no secretos)
```

## Esperado vs obtenido

<!-- qué esperabas y qué obtuviste -->

## Reproducción

<!-- bundle mínimo, fixture o pasos con init/validate -->

## Entorno

<!-- node --version, commit/branch -->
