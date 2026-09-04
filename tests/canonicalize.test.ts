import { describe, it, expect } from "vitest";
import {
  canonicalizeYaml,
  canonicalizeJson,
  isCanonicalYaml,
  isCanonicalJson,
  canonicalizeFile,
} from "../src/canonicalize.js";
import { computeIntegrity } from "../src/integrity.js";
import { normalizeDirectory } from "../src/normalize.js";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("canonicalize", () => {
  describe("canonicalizeYaml", () => {
    it("sorts keys alphabetically", () => {
      const input = "b: 2\na: 1\n";
      const output = canonicalizeYaml(input);
      expect(output).toBe("a: 1\nb: 2\n");
    });

    it("sorts nested keys recursively", () => {
      const input = "b:\n  d: 4\n  c: 3\na: 1\n";
      const output = canonicalizeYaml(input);
      expect(output).toBe("a: 1\nb:\n  c: 3\n  d: 4\n");
    });

    it("preserves array order (arrays are ordered)", () => {
      const input = "- 3\n- 1\n- 2\n";
      const output = canonicalizeYaml(input);
      expect(output).toBe("- 3\n- 1\n- 2\n");
    });

    it("uses 2-space indent, no anchors, LF", () => {
      const input = "a: 1\nb: 2\n";
      const output = canonicalizeYaml(input);
      expect(output).not.toContain("&");
      expect(output).not.toContain("*");
      expect(output).toMatch(/^a: 1\nb: 2\n$/);
    });

    it("is idempotent", () => {
      const input = "b: 2\na: 1\n";
      const first = canonicalizeYaml(input);
      const second = canonicalizeYaml(first);
      expect(first).toBe(second);
    });
  });

  describe("canonicalizeJson", () => {
    it("sorts keys alphabetically", () => {
      const input = '{"b": 2, "a": 1}';
      const output = canonicalizeJson(input);
      expect(output).toBe('{\n  "a": 1,\n  "b": 2\n}');
    });

    it("sorts nested keys recursively", () => {
      const input = '{"b": {"d": 4, "c": 3}, "a": 1}';
      const output = canonicalizeJson(input);
      expect(output).toBe('{\n  "a": 1,\n  "b": {\n    "c": 3,\n    "d": 4\n  }\n}');
    });

it("preserves array order (arrays are ordered)", () => {
      const input = "[3, 1, 2]";
      const output = canonicalizeJson(input);
      expect(output).toBe("[\n  3,\n  1,\n  2\n]");
    });

    it("uses 2-space indent, no trailing space", () => {
      const input = '{"a": 1}';
      const output = canonicalizeJson(input);
      expect(output).toBe('{\n  "a": 1\n}');
    });

    it("is idempotent", () => {
      const input = '{"b": 2, "a": 1}';
      const first = canonicalizeJson(input);
      const second = canonicalizeJson(first);
      expect(first).toBe(second);
    });
  });

  describe("isCanonicalYaml", () => {
    it("returns true for canonical YAML", () => {
      expect(isCanonicalYaml("a: 1\nb: 2\n")).toBe(true);
    });

    it("returns false for non-canonical YAML", () => {
      expect(isCanonicalYaml("b: 2\na: 1\n")).toBe(false);
    });
  });

  describe("isCanonicalJson", () => {
    it("returns true for canonical JSON", () => {
      expect(isCanonicalJson('{\n  "a": 1,\n  "b": 2\n}')).toBe(true);
    });

    it("returns false for non-canonical JSON", () => {
      expect(isCanonicalJson('{"b": 2, "a": 1}')).toBe(false);
    });
  });

  describe("canonicalizeFile", () => {
    it("canonicalizes .yaml files", () => {
      const input = "b: 2\na: 1\n";
      expect(canonicalizeFile(input, ".yaml")).toBe("a: 1\nb: 2\n");
    });

    it("canonicalizes .yml files", () => {
      const input = "b: 2\na: 1\n";
      expect(canonicalizeFile(input, ".yml")).toBe("a: 1\nb: 2\n");
    });

    it("canonicalizes .json files", () => {
      const input = '{"b": 2, "a": 1}';
      expect(canonicalizeFile(input, ".json")).toBe('{\n  "a": 1,\n  "b": 2\n}');
    });

    it("returns unchanged for other extensions", () => {
      const input = "b: 2\na: 1\n";
      expect(canonicalizeFile(input, ".txt")).toBe(input);
    });
  });
});

describe("integrity", () => {
  it("computes sha256 per file and global hash", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "webconfig-test-"));
    try {
      writeFileSync(join(tempDir, "a.txt"), "hello");
      writeFileSync(join(tempDir, "b.txt"), "world");

      const integrity = computeIntegrity(tempDir);
      expect(integrity.files).toHaveLength(2);
      expect(integrity.files[0].path).toBe("a.txt");
      expect(integrity.files[1].path).toBe("b.txt");
      expect(integrity.globalHash).toMatch(/^[a-f0-9]{64}$/);

      // Same content = same global hash
      const integrity2 = computeIntegrity(tempDir);
      expect(integrity2.globalHash).toBe(integrity.globalHash);
    } finally {
      rmSync(tempDir, { recursive: true });
    }
  });

  it("global hash is order-independent", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "webconfig-test-"));
    try {
      writeFileSync(join(tempDir, "a.txt"), "hello");
      writeFileSync(join(tempDir, "b.txt"), "world");

      const integrity = computeIntegrity(tempDir);

      // Create same files in different order
      const tempDir2 = mkdtempSync(join(tmpdir(), "webconfig-test-"));
      writeFileSync(join(tempDir2, "b.txt"), "world");
      writeFileSync(join(tempDir2, "a.txt"), "hello");

      const integrity2 = computeIntegrity(tempDir2);
      expect(integrity2.globalHash).toBe(integrity.globalHash);

      rmSync(tempDir2, { recursive: true });
    } finally {
      rmSync(tempDir, { recursive: true });
    }
  });
});

describe("normalize", () => {
  it("normalizes directory with --write", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "webconfig-test-"));
    try {
      writeFileSync(join(tempDir, "test.yaml"), "b: 2\na: 1\n");
      writeFileSync(join(tempDir, "test.json"), '{"b": 2, "a": 1}');

      const result = await normalizeDirectory(tempDir, { check: false, write: true });
      expect(result.normalized).toBe(2);
      expect(result.errors).toHaveLength(0);

      // Verify files are now canonical
      const checkResult = await normalizeDirectory(tempDir, { check: true, write: false });
      expect(checkResult.errors).toHaveLength(0);
    } finally {
      rmSync(tempDir, { recursive: true });
    }
  });

  it("reports non-canonical files with --check", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "webconfig-test-"));
    try {
      writeFileSync(join(tempDir, "test.yaml"), "b: 2\na: 1\n");

      const result = await normalizeDirectory(tempDir, { check: true, write: false });
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("test.yaml: not canonical");
    } finally {
      rmSync(tempDir, { recursive: true });
    }
  });

  it("idempotent: double pass = byte-identical", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "webconfig-test-"));
    try {
      writeFileSync(join(tempDir, "test.yaml"), "b: 2\na: 1\n");
      writeFileSync(join(tempDir, "test.json"), '{"b": 2, "a": 1}');

      await normalizeDirectory(tempDir, { check: false, write: true });
      const first = await normalizeDirectory(tempDir, { check: false, write: true });
      expect(first.normalized).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true });
    }
  });
});