# Política de seguridad

### Propósito de este documento

- **Objetivos:** Declarar versiones soportadas, el canal privado de avisos y la superficie de la CLI (validador, export, integridad).
- **Estructura:** Versiones soportadas → cómo reportar → superficie relevante → alcance (CLI local, no SaaS).
- **Contenido a integrar según contexto:** Adapta versiones de la herramienta y del formato `site.bundle`. No copies la política de un SaaS ni un desk de comunidad. No reutilices fixtures o tokens de ejemplo con secretos reales; no commitees `.env` ni claves.

## Versiones soportadas

| Versión                     | Soportada                                          |
| --------------------------- | -------------------------------------------------- |
| 1.3.x (herramienta, `main`) | Sí                                                 |
| 1.2.x / 1.1.x               | Solo histórico                                     |
| Formato site.bundle 1.0.0   | Sí (congelado; ver `docs/architecture/decisions/`) |

La versión de la **herramienta** (`package.json`) y la del **formato** (`schemas/`, `schema_compat`) son contratos distintos. Un parche de la CLI no cambia el formato.

## Cómo reportar una vulnerabilidad

**No abras un issue público** si el hallazgo puede filtrar secretos, romper integridad de paquetes o facilitar inyección en un bundle.

1. Preferible: [GitHub Security Advisory](https://github.com/Iniciativas-Alexendros/webconfig/security/advisories/new) en este repositorio.
2. Alternativa: correo a [operaciones@alexendros.dev](mailto:operaciones@alexendros.dev).

Incluye: versión o commit, comando reproducido (`validate` / `export` / `init`…), sistema operativo, y un bundle **mínimo sintético** (nunca claves reales). Responderemos en un plazo máximo de 7 días naturales.

## Superficie relevante

- El validador marca secretos de alta confianza con `SECRET_001` (error) y patrones ambiguos con `CRYPTO_001` (aviso).
- `export` e `integrity` son deterministas; un hash que no coincida es `INTEGRITY_001` / `INTEGRITY_002`.
- No commitees `.env`, tokens ni claves. `.env` está en `.gitignore`.
- CI ejecuta `npm audit --omit=dev --audit-level=high` en el job `quality`.
- Renovate (`.github/renovate.json`) cubre `npm` y `github-actions`. No hay Dependabot de version-updates.

## Alcance

Este repositorio es una CLI local. No opera un SaaS ni almacena paquetes de clientes. Las vulnerabilidades de un sitio generado a partir de un `site.bundle` pertenecen al generador o al hosting, no a este validador, salvo que el defecto esté en la validación o el empaquetado.
