# Documentación de webconfig

### Propósito de este documento

- **Objetivos:** Indexar la documentación de producto (ADRs, guías y runbooks) y apuntar a los contratos de la raíz.
- **Estructura:** Tabla de rutas `docs/` → enlaces a README, AGENTS, ARCHITECTURE, CONTRIBUTING y SECURITY.
- **Contenido a integrar según contexto:** Adapta el índice al árbol de este repo. No copies guías de landing/SaaS ni packages de UI ajenos. El Design System y los tokens se documentan en `guides/design-system.md`, no se importan de otro catálogo público.

| Ruta | Para qué |
| ---- | -------- |
| [architecture/decisions/](./architecture/decisions/) | ADRs y registro histórico |
| [guides/desarrollo.md](./guides/desarrollo.md) | Arranque local y PR |
| [guides/design-system.md](./guides/design-system.md) | Tokens OKLCH y Showcase |
| [guides/calidad.md](./guides/calidad.md) | Coverage, fixtures y jobs de CI |
| [runbooks/ci-release.md](./runbooks/ci-release.md) | Fallos de CI y semantic-release |
| [runbooks/validacion-bundles.md](./runbooks/validacion-bundles.md) | Diagnosticar `validate` / `export` |

En la raíz: [README.md](../README.md), [AGENTS.md](../AGENTS.md), [ARCHITECTURE.md](../ARCHITECTURE.md), [CONTRIBUTING.md](../CONTRIBUTING.md), [SECURITY.md](../SECURITY.md).
