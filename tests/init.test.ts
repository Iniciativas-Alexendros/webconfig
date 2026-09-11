import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { initBundle } from "../src/init.js";
import { validateBundle } from "../src/validate/index.js";

const execFileAsync = promisify(execFile);
const cliPath = resolve("dist/cli.js");

describe("init", () => {
  it("creates a valid starter bundle that validates with no errors or warnings", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webconfig-init-"));
    try {
      const result = await initBundle(join(dir, "my-site"), { name: "Mi Sitio" });

      expect(result.createdFiles).toContain("manifest.yaml");
      expect(result.createdFiles).toContain("site.config.yaml");
      expect(result.createdFiles).toContain("composition/home.yaml");
      expect(result.createdFiles).toContain("composition/contacto.yaml");
      expect(result.createdFiles).toContain("content/es/home.json");
      expect(result.createdFiles).toContain("content/en/home.json");
      expect(result.createdFiles).toContain("content/seo/es/home.yaml");
      expect(result.createdFiles).toContain("content/seo/en/home.yaml");
      expect(result.createdFiles).toContain("assets/brand/logo.svg");

      const validation = await validateBundle({
        bundlePath: result.bundleDir,
        dsCatalogPath: result.catalogPath,
      });
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("refuses to overwrite a non-empty directory without --force", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webconfig-init-"));
    try {
      await writeFile(join(dir, "existing.txt"), "content");
      await expect(initBundle(dir)).rejects.toThrow(/already exists and is not empty/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("init command works via CLI and the generated bundle validates", async () => {
    const dir = await mkdtemp(join(tmpdir(), "webconfig-init-"));
    try {
      const bundleDir = join(dir, "site");
      const { stdout, stderr } = await execFileAsync("node", [cliPath, "init", bundleDir]);
      expect(stderr).toBe("");
      expect(stdout).toContain("Initialized bundle");

      const { stdout: validateOut } = await execFileAsync("node", [cliPath, "validate", bundleDir]);
      expect(validateOut).toContain("Valid bundle");
      expect(validateOut).not.toContain("ERRORS:");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
