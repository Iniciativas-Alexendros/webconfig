import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DSComponent {
  id: string;
  name: string;
  category: "layout" | "nav" | "content" | "form" | "media";
  description?: string;
  propsSchema?: Record<string, unknown>;
}

export interface DSCatalog {
  components: DSComponent[];
}

const CATEGORY_ENUM = ["layout", "nav", "content", "form", "media"] as const;

export function isValidCategory(category: string): category is (typeof CATEGORY_ENUM)[number] {
  return CATEGORY_ENUM.includes(category as (typeof CATEGORY_ENUM)[number]);
}

export function loadDSCatalog(catalogPath: string): DSCatalog {
  const content = readFileSync(catalogPath, "utf-8");
  const parsed = parse(content);
  if (!parsed || !Array.isArray(parsed.components)) {
    throw new Error("Invalid DS catalog: missing components array");
  }
  for (const comp of parsed.components) {
    if (!comp.id || !comp.category) {
      throw new Error("Invalid DS catalog: component missing id or category");
    }
    if (!isValidCategory(comp.category)) {
      throw new Error(`Invalid DS catalog: component ${comp.id} has invalid category ${comp.category}`);
    }
  }
  return parsed as DSCatalog;
}

export function createComponentIndex(catalog: DSCatalog): Map<string, DSComponent> {
  const index = new Map<string, DSComponent>();
  for (const comp of catalog.components) {
    index.set(comp.id, comp);
  }
  return index;
}

export function getLayoutComponents(catalog: DSCatalog): DSComponent[] {
  return catalog.components.filter((c) => c.category === "layout");
}

export function isLayoutComponent(comp: DSComponent): boolean {
  return comp.category === "layout";
}

export function validateComponentProps(
  component: DSComponent,
  props: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!component.propsSchema) {
    return { valid: true, errors: [] };
  }
  const schema = component.propsSchema as Record<string, { type?: string; required?: boolean; properties?: Record<string, unknown> }>;
  for (const [key, propSchema] of Object.entries(schema)) {
    if (propSchema.required && !(key in props)) {
      errors.push(`Missing required prop: ${key}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function getIconWhitelist(catalog: DSCatalog): string[] {
  const icons = new Set<string>();
  for (const comp of catalog.components) {
    const propsSchema = comp.propsSchema as Record<string, unknown> | undefined;
    if (propsSchema && propsSchema["icon"]) {
      const iconSchema = propsSchema["icon"] as Record<string, unknown>;
      const enumVal = iconSchema["enum"];
      if (Array.isArray(enumVal)) {
        for (const icon of enumVal) {
          if (typeof icon === "string") {
            icons.add(icon);
          }
        }
      }
    }
  }
  return Array.from(icons);
}