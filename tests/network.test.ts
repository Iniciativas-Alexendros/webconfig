import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = [
  "node:http",
  "node:https",
  "node:net",
  "node:dns",
  "node:tls",
  "fetch(",
  "globalThis.fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "navigator.sendBeacon",
  "sendBeacon(",
];

const SHOWCASE_FORBIDDEN = [
  "fetch(",
  "globalThis.fetch",
  "XMLHttpRequest",
  "WebSocket(",
  "new EventSource",
  "sendBeacon(",
  "node:http",
  "node:https",
  "node:net",
];

function collectFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, files);
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(full);
    }
  }
  return files;
}

describe("no network in runtime", () => {
  const srcFiles = collectFiles("src");

  it("runtime source does not import or call network APIs", () => {
    const offenders: string[] = [];
    for (const file of srcFiles) {
      const content = readFileSync(file, "utf-8");
      for (const token of FORBIDDEN) {
        if (content.includes(token)) {
          offenders.push(`${file}: ${token}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("runtime source has no dependencies that require network at import time", () => {
    for (const file of srcFiles) {
      const content = readFileSync(file, "utf-8");
      const imported = content.match(/from\s+["']([^"']+)["']/g) ?? [];
      for (const line of imported) {
        expect(line).not.toMatch(/node:http|node:https|node:net|node:dns|node:tls/);
      }
      expect(content).not.toMatch(/\bimport\s*\(\s*["']node:(http|https|net|dns|tls)["']\s*\)/);
      expect(content).not.toMatch(/\brequire\s*\(\s*["']node:(http|https|net|dns|tls)["']\s*\)/);
    }
  });
});

describe("no network in showcase", () => {
  const showcaseFiles = collectFiles("showcase/src");

  it("showcase source does not call network APIs", () => {
    const offenders: string[] = [];
    for (const file of showcaseFiles) {
      const content = readFileSync(file, "utf-8");
      for (const token of SHOWCASE_FORBIDDEN) {
        if (content.includes(token)) {
          offenders.push(`${file}: ${token}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
