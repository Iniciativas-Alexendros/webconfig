const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);
const HASH_D = "d".repeat(64);
const HASH_E = "e".repeat(64);

/** site.bundle mínimo y sintético. La GUI lo valida si el usuario no abre archivos. */
export const EXAMPLE_BUNDLE_FILES: Record<string, string> = {
  "manifest.yaml": `bundleVersion: 1.0.0
createdAt: "2026-01-15T10:00:00.000Z"
description: Ejemplo local para validar el esquema en el navegador
integrity:
  files:
    composition/home.yaml: "${HASH_A}"
    content/es/home.json: "${HASH_B}"
    content/seo/es/home.yaml: "${HASH_C}"
    site.config.yaml: "${HASH_D}"
  global: "${HASH_E}"
name: ejemplo-local
schema_compat: ^1.0.0
siteConfig: site.config.yaml
updatedAt: "2026-01-15T10:00:00.000Z"
`,
  "site.config.yaml": `defaultLocale: es
fallbackLocale: es
locales:
  - es
name: Ejemplo local
navigation:
  footer:
    - href: /
      label: Inicio
  header:
    - href: /
      label: Inicio
theme:
  colorScheme: light
  fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
  radius: md
timezone: Europe/Madrid
version: 1.0.0
`,
  "composition/home.yaml": `components:
  - id: hero-home
    parentId: null
    props:
      headline: Ejemplo local
    type: hero
page: home
`,
  "content/es/home.json": `{
  "blocks": [
    {
      "id": "hero-home",
      "type": "hero",
      "values": { "headline": "Ejemplo local" }
    }
  ]
}
`,
  "content/seo/es/home.yaml": `description: Ejemplo local de SEO para la validación de esquema
jsonLd:
  "@context": https://schema.org
  "@type": WebSite
  name: Ejemplo local
keywords:
  - ejemplo
openGraph:
  title: Ejemplo local
  description: Ejemplo local de SEO para la validación de esquema
title: Ejemplo local
twitter:
  card: summary
  title: Ejemplo local
`,
};

export function exampleBundleMap(): Map<string, string> {
  return new Map(Object.entries(EXAMPLE_BUNDLE_FILES));
}
