import { promises as fs } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { stringify } from "yaml";
import { canonicalizeJson, canonicalizeYaml } from "./canonicalize.js";
import { BUNDLE_VERSION, SCHEMA_COMPAT } from "./constants.js";
import { computeIntegrity } from "./integrity.js";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#2563eb"/><text x="16" y="21" font-family="sans-serif" font-size="14" fill="#fff" text-anchor="middle">W</text></svg>\n`;

export interface InitOptions {
  name?: string;
  force?: boolean;
}

export interface InitResult {
  bundleDir: string;
  createdFiles: string[];
  catalogPath?: string | undefined;
  catalogWritten: boolean;
}

function headerProps(): Record<string, unknown> {
  return {
    logo: { alt: "Logo", href: "/", src: "assets/brand/logo.svg" },
    navigation: [
      { href: "/", label: "Inicio" },
      { href: "/contacto", label: "Contacto" },
    ],
  };
}

function footerProps(copyright: string): Record<string, unknown> {
  return {
    copyright,
    links: [
      { href: "/", label: "Inicio" },
      { href: "/contacto", label: "Contacto" },
    ],
  };
}

function toYaml(obj: unknown): string {
  return canonicalizeYaml(stringify(obj, { indent: 2, lineWidth: -1 }));
}

function toJson(obj: unknown): string {
  return canonicalizeJson(JSON.stringify(obj));
}

function siteConfig(name: string): string {
  return toYaml({
    defaultLocale: "es",
    fallbackLocale: "es",
    locales: ["es", "en"],
    name,
    navigation: {
      footer: [
        { href: "/", label: "Inicio" },
        { href: "/contacto", label: "Contacto" },
      ],
      header: [
        { href: "/", label: "Inicio" },
        { href: "/contacto", label: "Contacto" },
      ],
    },
    theme: { colorScheme: "light", fontFamily: "Inter, system-ui, sans-serif", radius: "md" },
    timezone: "Europe/Madrid",
    version: "1.0.0",
  });
}

function compositionHome(name: string): string {
  return toYaml({
    components: [
      { id: "header-main", parentId: null, props: headerProps(), type: "header" },
      {
        id: "hero-home",
        parentId: null,
        props: {
          cta: { href: "/contacto", label: "Empieza ahora", variant: "primary" },
          headline: "Hola, mundo",
          subheadline: "Bienvenido a tu nuevo sitio. Edita composition/home.yaml para personalizarlo.",
        },
        type: "hero",
      },
      {
        id: "intro",
        parentId: null,
        props: {
          content: "Este es un bloque de texto. Añade más componentes, páginas e idiomas a tu bundle.",
        },
        type: "text-block",
      },
      {
        id: "footer-main",
        parentId: null,
        props: footerProps(`© 2026 ${name}. Todos los derechos reservados.`),
        type: "footer",
      },
    ],
    page: "home",
  });
}

function compositionContacto(name: string): string {
  return toYaml({
    components: [
      { id: "header-main", parentId: null, props: headerProps(), type: "header" },
      {
        id: "hero-contacto",
        parentId: null,
        props: { content: "Página de contacto. Sustituye este texto por tu formulario o información de contacto." },
        type: "text-block",
      },
      {
        id: "footer-main",
        parentId: null,
        props: footerProps(`© 2026 ${name}. Todos los derechos reservados.`),
        type: "footer",
      },
    ],
    page: "contacto",
  });
}

function contentHome(copyright: string): Record<string, unknown> {
  return {
    blocks: [
      { id: "header-main", type: "header", values: headerProps() },
      {
        id: "hero-home",
        type: "hero",
        values: {
          cta: { href: "/contacto", label: "Empieza ahora", target: "_self" },
          headline: "Hola, mundo",
          subheadline: "Bienvenido a tu nuevo sitio. Edita content por idioma para localizarlo.",
        },
      },
      {
        id: "intro",
        type: "text-block",
        values: { content: "Este es un bloque de texto localizable por idioma.", variant: "body" },
      },
      { id: "footer-main", type: "footer", values: footerProps(copyright) },
    ],
  };
}

function contentContacto(copyright: string): Record<string, unknown> {
  return {
    blocks: [
      { id: "header-main", type: "header", values: headerProps() },
      {
        id: "hero-contacto",
        type: "text-block",
        values: { content: "Página de contacto localizable por idioma.", variant: "body" },
      },
      { id: "footer-main", type: "footer", values: footerProps(copyright) },
    ],
  };
}

function seoPage(title: string, description: string): string {
  return toYaml({
    canonical: "https://example.com/",
    description,
    jsonLd: { "@context": "https://schema.org", "@type": "WebSite", name: title },
    keywords: ["starter", "site"],
    openGraph: { description, title, type: "website" },
    robots: "index,follow",
    title,
    twitter: { card: "summary", description, title },
  });
}

function catalogYaml(): string {
  return toYaml({
    components: [
      {
        id: "header",
        name: "Site Header",
        category: "layout",
        description: "Site header with logo, navigation, and optional CTA",
        propsSchema: {
          type: "object",
          properties: {
            logo: {
              type: "object",
              properties: {
                src: { type: "string" },
                alt: { type: "string" },
                href: { type: "string" },
              },
              required: ["src", "alt", "href"],
            },
            navigation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  href: { type: "string" },
                },
                required: ["label", "href"],
              },
            },
            cta: {
              type: "object",
              properties: {
                label: { type: "string" },
                href: { type: "string" },
                variant: { type: "string", enum: ["primary", "secondary"] },
              },
              required: ["label", "href"],
            },
          },
          required: ["logo", "navigation"],
        },
      },
      {
        id: "hero",
        name: "Hero Section",
        category: "layout",
        description: "Full-width hero banner with headline, subheadline, and CTA",
        propsSchema: {
          type: "object",
          properties: {
            headline: { type: "string" },
            subheadline: { type: "string" },
            cta: {
              type: "object",
              properties: {
                label: { type: "string" },
                href: { type: "string" },
                variant: { type: "string", enum: ["primary", "secondary", "outline"] },
              },
              required: ["label", "href"],
            },
          },
          required: ["headline", "cta"],
        },
      },
      {
        id: "footer",
        name: "Site Footer",
        category: "layout",
        description: "Site footer with links, copyright, and social links",
        propsSchema: {
          type: "object",
          properties: {
            copyright: { type: "string" },
            links: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  href: { type: "string" },
                },
                required: ["label", "href"],
              },
            },
          },
          required: ["copyright", "links"],
        },
      },
      {
        id: "text-block",
        name: "Text Block",
        category: "content",
        description: "Rich text content block with formatting",
        propsSchema: {
          type: "object",
          properties: {
            content: { type: "string" },
            variant: { type: "string", enum: ["body", "lead", "caption"] },
          },
          required: ["content"],
        },
      },
    ],
  });
}

export async function initBundle(dir: string, options: InitOptions = {}): Promise<InitResult> {
  const bundleDir = resolve(dir);
  const name = options.name || basename(bundleDir);
  const copyright = `© ${new Date().getFullYear()} ${name}. Todos los derechos reservados.`;

  if (!options.force) {
    let existing: string[];
    try {
      existing = await fs.readdir(bundleDir);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw err;
      existing = [];
    }
    if (existing.length > 0) {
      throw new Error(`Directory ${bundleDir} already exists and is not empty (use --force to overwrite)`);
    }
  } else {
    await fs.rm(bundleDir, { recursive: true, force: true });
  }

  await fs.mkdir(bundleDir, { recursive: true });
  const createdFiles: string[] = [];

  async function write(relativePath: string, content: string): Promise<void> {
    const fullPath = join(bundleDir, relativePath);
    await fs.mkdir(dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
    createdFiles.push(relativePath);
  }

  const esHome = seoPage(name, `${name} - Sitio de ejemplo. Descripción de menos de 160 caracteres.`);
  const enHome = seoPage(name, `${name} - Starter site. A description under 160 characters.`);
  const esContacto = seoPage(`${name} | Contacto`, `Contacta con ${name}. Descripción de menos de 160 caracteres.`);
  const enContacto = seoPage(`${name} | Contact`, `Contact ${name}. A description under 160 characters.`);

  await write("site.config.yaml", siteConfig(name));
  await write("composition/home.yaml", compositionHome(name));
  await write("composition/contacto.yaml", compositionContacto(name));
  await write("content/es/home.json", toJson(contentHome(copyright)));
  await write("content/en/home.json", toJson(contentHome(copyright)));
  await write("content/es/contacto.json", toJson(contentContacto(copyright)));
  await write("content/en/contacto.json", toJson(contentContacto(copyright)));
  await write("content/seo/es/home.yaml", esHome);
  await write("content/seo/en/home.yaml", enHome);
  await write("content/seo/es/contacto.yaml", esContacto);
  await write("content/seo/en/contacto.yaml", enContacto);
  await write("assets/brand/logo.svg", LOGO_SVG);

  const integrity = computeIntegrity(bundleDir);
  const files: Record<string, string> = {};
  for (const f of integrity.files) {
    files[f.path] = f.hash;
  }

  const now = new Date().toISOString();
  await write(
    "manifest.yaml",
    toYaml({
      bundleVersion: BUNDLE_VERSION,
      createdAt: now,
      description: `Bundle de ejemplo creado con webconfig init (${name})`,
      integrity: { files, global: integrity.globalHash },
      name,
      schema_compat: SCHEMA_COMPAT,
      siteConfig: "site.config.yaml",
      updatedAt: now,
    })
  );

  let catalogWritten = false;
  let catalogPath: string | undefined;
  const parentDir = dirname(bundleDir);
  const defaultCatalog = join(parentDir, "ds-catalog.yaml");
  const exists = await fs
    .access(defaultCatalog)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    await fs.writeFile(defaultCatalog, catalogYaml(), "utf-8");
    catalogWritten = true;
    catalogPath = defaultCatalog;
  }

  return { bundleDir, createdFiles, catalogPath: catalogPath ?? undefined, catalogWritten };
}
