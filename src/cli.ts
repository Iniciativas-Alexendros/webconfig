#!/usr/bin/env node
import { program } from "commander";
import { resolve } from "node:path";
import { normalizeDirectory } from "./normalize.js";
import { computeIntegrity } from "./integrity.js";

program
  .name("webconfig")
  .description("site.bundle v1.0.0 validator & exporter")
  .version("1.0.0");

program
  .command("normalize <dir>")
  .description("Normalize YAML/JSON files to canonical form")
  .option("--check", "Exit 1 if non-canonical, do not write")
  .option("--write", "Normalize files in-place")
  .action(async (dir: string, options: { check: boolean; write: boolean }) => {
    const { normalized, errors } = await normalizeDirectory(dir, options);

    if (options.check) {
      if (errors.length > 0) {
        for (const err of errors) {
          console.error(err);
        }
        process.exit(1);
      }
      console.log("All files are canonical");
      process.exit(0);
    }

    if (options.write) {
      console.log(`Normalized ${normalized} file(s)`);
      process.exit(0);
    }

    if (errors.length > 0) {
      for (const err of errors) {
        console.log(err);
      }
    } else {
      console.log("All files are canonical");
    }
  });

program
  .command("integrity <dir>")
  .description("Compute integrity hashes for a bundle")
  .action((dir: string) => {
    const integrity = computeIntegrity(resolve(dir));
    console.log(`Global hash: ${integrity.globalHash}`);
    console.log(`Files: ${integrity.files.length}`);
    for (const file of integrity.files) {
      console.log(`${file.hash}  ${file.path}  (${file.size} bytes)`);
    }
  });

async function runValidate(bundle: string, options: { ds?: string; strict?: boolean; json?: boolean }) {
  const { validateBundle, formatValidationResult, getExitCode } = await import("./validate/index.js");
  const result = await validateBundle({
    bundlePath: resolve(bundle),
    dsCatalogPath: options.ds ? resolve(options.ds) : undefined,
    strict: options.strict,
    json: options.json,
  });
  console.log(formatValidationResult(result, options.json));
  process.exit(getExitCode(result, options.strict));
}

async function runExport(bundle: string, output: string) {
  const { loadBundle } = await import("./load.js");
  const { exportBundle } = await import("./export/bundler.js");
  const loaded = await loadBundle(resolve(bundle));
  try {
    await exportBundle({
      bundleDir: loaded.bundleDir,
      outputPath: resolve(output),
    });
    console.log(`Exported to ${output}`);
  } finally {
    await loaded.cleanup();
  }
}

program
  .command("validate <bundle>")
  .description("Validate a site.bundle directory or .tar.gz")
  .option("--ds <path>", "Path to ds-catalog.yaml (defaults to parent dir)")
  .option("--strict", "Exit 1 on warnings as well")
  .option("--json", "Output JSON for pipeline consumption")
  .action(async (bundle: string, options: { ds?: string; strict?: boolean; json?: boolean }) => {
    try {
      await runValidate(bundle, options);
    } catch (err) {
      const { formatValidationResult, getExitCode } = await import("./validate/index.js");
      const issue = {
        code: "SYNTAX_ERROR",
        severity: "error" as const,
        file: bundle,
        message: err instanceof Error ? err.message : String(err),
      };
      const result = { errors: [issue], warnings: [], valid: false };
      console.log(formatValidationResult(result, options.json));
      process.exit(1);
    }
  });

program
  .command("export <bundle> <output>")
  .description("Export a site.bundle directory to deterministic .tar.gz")
  .action(async (bundle: string, output: string) => {
    try {
      await runExport(bundle, output);
    } catch (err) {
      console.error(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program.parse();