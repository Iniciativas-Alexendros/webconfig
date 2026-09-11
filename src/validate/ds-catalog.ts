import { readFileSync } from "node:fs";
import { parse } from "yaml";

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
  const schema = component.propsSchema as Record<string, unknown>;
  const required = (schema["required"] as string[]) || [];
  const properties = (schema["properties"] as Record<string, unknown>) || {};
  for (const key of required) {
    if (!(key in props)) {
      errors.push(`Missing required prop: ${key}`);
    }
  }
  for (const [key, value] of Object.entries(properties)) {
    if (!(key in props)) continue;
    const propSchema = value as Record<string, unknown>;
    if (propSchema["type"] === "string" && typeof props[key] !== "string") {
      errors.push(`Prop ${key} must be a string`);
    } else if (propSchema["type"] === "number" && typeof props[key] !== "number") {
      errors.push(`Prop ${key} must be a number`);
    } else if (propSchema["type"] === "boolean" && typeof props[key] !== "boolean") {
      errors.push(`Prop ${key} must be a boolean`);
    }
    if (propSchema["enum"] && Array.isArray(propSchema["enum"]) && !propSchema["enum"].includes(props[key])) {
      errors.push(`Prop ${key} must be one of: ${(propSchema["enum"] as string[]).join(", ")}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function getIconWhitelist(catalog: DSCatalog): string[] {
  const icons = new Set<string>();
  for (const comp of catalog.components) {
    const propsSchema = comp.propsSchema as Record<string, unknown> | undefined;
    if (!propsSchema) continue;
    collectIconEnums(propsSchema, icons);
  }
  return Array.from(icons);
}

function collectIconEnums(node: unknown, icons: Set<string>): void {
  if (!node || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  if (Array.isArray(record["enum"])) {
    for (const icon of record["enum"] as unknown[]) {
      if (typeof icon === "string") icons.add(icon);
    }
  }
  if (record["items"] && typeof record["items"] === "object") {
    collectIconEnums(record["items"], icons);
  }
  if (record["properties"] && typeof record["properties"] === "object") {
    for (const value of Object.values(record["properties"] as Record<string, unknown>)) {
      collectIconEnums(value, icons);
    }
  }
  for (const [key, value] of Object.entries(record)) {
    if (key === "enum" || key === "items" || key === "properties") continue;
    if (value && typeof value === "object") collectIconEnums(value, icons);
  }
}
