#!/usr/bin/env node
import { program } from "commander";
import { normalizeDirectory } from "./normalize.js";
import { computeIntegrity } from "./integrity.js";
import { resolve } from "node:path";

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

program.parse();