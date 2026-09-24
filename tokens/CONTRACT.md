# Contrato de tokens v1.0

### Propósito de este documento

- **Objetivos:** Fijar la forma canónica de las hojas DTCG de este repositorio para que otros productos la copien sin inventar nombres.
- **Estructura:** Versión → hojas → nombres semánticos → build y contraste → qué no se pinta a mano.
- **Contenido a integrar según contexto:** Copia la forma (nombres, tiers, `$extensions.mode`, OKLCH). Cambia solo `$meta.ds` al id del producto. No renombres tokens ni metas estas hojas dentro de un `site.bundle`.

**Versión:** 1.0  
**Esquema:** [`contract.schema.json`](./contract.schema.json) (fuera de `schemas/` de site.bundle)  
**Producto:** `$meta.ds` = `webconfig`

Cada hoja es un objeto con `$meta` (`ds`, `tier` = `primitive` | `semantic` | `component`, `version` = `"1.0"`) y grupos DTCG. Cada token tiene `$value` (string) y `$type`. `$description` es opcional. Los alias de color llevan `$extensions.mode.light` y `$extensions.mode.dark`. La hoja de color primitivo declara `$meta.colorSpace` = `oklch`; un color que no es referencia `{…}` se escribe `oklch(…)`.

## Hojas

| Fichero                           | Tier      | Grupos                                                             |
| --------------------------------- | --------- | ------------------------------------------------------------------ |
| `primitive.color.tokens.json`     | primitive | `color`                                                            |
| `semantic.color.tokens.json`      | semantic  | `bg`, `text`, `border`, `action`, `feedback`                       |
| `primitive.dimension.tokens.json` | primitive | `space`, `radius`, `border`, `shadow`, `motion`, `z`, `breakpoint` |
| `semantic.typography.tokens.json` | semantic  | `font`                                                             |
| `component.button.tokens.json`    | component | `button`, `card`, `input`, `badge`                                 |

`button`, `card` e `input` apuntan a tokens semánticos (o a primitivos de espacio, radio y sombra). `badge` aliasa `feedback`.

## Nombres

**Color primitivo**

- `color.brand`: `100` `200` `300` `400` `500` `600` `700` `800` `900`
- `color.neutral`: `0` `50` `100` `200` `300` `400` `500` `600` `700` `800` `900` `950` `1000`
- `color.success`: `100` `600` `700`
- `color.warning`: `100` `600` `700`
- `color.danger`: `100` `600` `700`
- `color.focus`: `ring`

**Color semántico** (`$extensions.mode` light y dark)

- `bg`: `base` `surface` `muted`
- `text`: `base` `muted` `link`
- `border`: `base` `strong`
- `action`: `primary-bg` `primary-bg-hover` `on-primary` `secondary-bg` `on-secondary` `focus-ring`
- `feedback`: `success-bg` `success-text` `warning-bg` `warning-text` `danger-bg` `danger-text`

**Dimensión**

- `space`: `0` `1` `2` `3` `4` `5` `6` `8` `10` `12` `16`
- `radius`: `none` `sm` `md` `lg` `full`
- `border.width`: `thin` `medium` `thick`
- `shadow`: `sm` `md` `lg` `none`
- `motion.duration`: `fast` `base` `slow`
- `motion.easing`: `out`
- `z`: `0` `10` `20` `30` `40` `50`
- `breakpoint`: `sm` `md` `lg` `xl`

**Tipografía** (`font`)

- familias: `sans` `mono`
- `weight`: `regular` `medium` `semibold` `bold`
- `size`: `caption` `body` `lead` `h6` `h5` `h4` `h3` `h2` `h1`
- `leading`: `tight` `base` `relaxed`
- `tracking`: `tight` `base` `wide`

**Componente**

- `button`: `primary-bg` `primary-bg-hover` `on-primary` `secondary-bg` `on-secondary` `radius` `padding-x` `padding-y` `focus-ring`
- `card`: `bg` `border` `radius` `padding` `shadow`
- `input`: `bg` `border` `border-focus` `radius` `padding-x` `padding-y`
- `badge`: `success-bg` `warning-bg` `danger-bg` `radius`

## Build y contraste

`npm run tokens:build` escribe variables CSS (`--grupo-token`), `dist-tokens/json/tokens.json` con `{ light, dark }` y `fallback-hex.json`. El hex existe solo para el gate de contraste y para `@supports not (color: oklch(…))`. El CSS de tema oscuro responde a `data-theme="dark"` y a `prefers-color-scheme: dark` salvo que `data-theme="light"`.

Contraste, en claro y en oscuro: texto sobre fondo ≥ 4.5:1; bordes y UI ≥ 3:1.

La UI nueva usa solo esas variables. No pinta con hex ni con `oklch()` sueltos.
