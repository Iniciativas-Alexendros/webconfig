import { createHash } from "node:crypto";
import * as yaml from "yaml";

function sortKeysRecursive<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(sortKeysRecursive) as T;
  }
  if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysRecursive((obj as Record<string, unknown>)[key]);
    }
    return sorted as T;
  }
  return obj;
}

export function canonicalizeYaml(input: string): string {
  const parsed = yaml.parse(input);
  const sorted = sortKeysRecursive(parsed);
  const doc = new yaml.Document(sorted as yaml.Node);
  return doc.toString({
    indent: 2,
    lineWidth: -1,
    noAnchor: true,
    noRefs: true,
  } as yaml.ToStringOptions);
}

export function canonicalizeJson(input: string): string {
  const parsed = JSON.parse(input);
  const sorted = sortKeysRecursive(parsed);
  return JSON.stringify(sorted, null, 2);
}

export function isCanonicalYaml(input: string): boolean {
  return canonicalizeYaml(input) === input;
}

export function isCanonicalJson(input: string): boolean {
  return canonicalizeJson(input) === input;
}

export function canonicalizeFile(content: string, extension: string): string {
  if (extension === ".yaml" || extension === ".yml") {
    return canonicalizeYaml(content);
  }
  if (extension === ".json") {
    return canonicalizeJson(content);
  }
  return content;
}