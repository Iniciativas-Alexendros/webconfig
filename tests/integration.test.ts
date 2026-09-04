import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const cliPath = resolve("dist/cli.js");

describe("integration tests", () => {
  const goldenBundle = resolve("fixtures/golden/clinica-dental-sur");
  const dsCatalog = resolve("ds-catalog.example.yaml");

  it("validate command works via CLI", async () => {
    const { stdout, stderr } = await execFileAsync("node", [cliPath, "validate", goldenBundle, "--ds", dsCatalog]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Valid bundle");
  });

  it("validate command with --json outputs valid JSON", async () => {
    const { stdout, stderr } = await execFileAsync("node", [cliPath, "validate", goldenBundle, "--ds", dsCatalog, "--json"]);
    expect(stderr).toBe("");
    const result = JSON.parse(stdout);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    // Golden is intentionally partial in 'en' (falls back to es) -> I18N_002 warnings
    expect(result.warnings.length).toBeGreaterThan(0);
    for (const w of result.warnings) {
      expect(w.code).toBe("I18N_002");
    }
  });

  it("export command works via CLI", async () => {
    const { stdout, stderr } = await execFileAsync("node", [cliPath, "export", "fixtures/golden/clinica-dental-sur", "/tmp/integration-test.tar.gz"]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Exported to");
  });

  it("validate works on exported tar.gz", async () => {
    const { stdout, stderr } = await execFileAsync("node", [cliPath, "validate", "/tmp/integration-test.tar.gz", "--ds", dsCatalog]);
    expect(stderr).toBe("");
    expect(stdout).toContain("Valid bundle");
  });

  it("validate --json is fail-closed on parse errors (exit 1, valid JSON)", async () => {
    try {
      await execFileAsync("node", [cliPath, "validate", resolve("does-not-exist"), "--ds", dsCatalog, "--json"]);
      expect.unreachable("expected validate to fail");
    } catch (err) {
      const e = err as { code?: number; stdout?: string };
      expect(e.code).toBe(1);
      const result = JSON.parse(e.stdout ?? "");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.severity).toBe("error");
    }
  });
});