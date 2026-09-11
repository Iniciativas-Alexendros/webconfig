#!/usr/bin/env node
// Verify that every error code in src/validate/errors.ts has a corresponding
// invalid fixture that actually triggers it, and that every invalid fixture
// maps back to a known code.
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Codes that are structural and cannot be represented by a standalone
// invalid fixture (they fire when a whole directory is missing).
const STRUCTURAL_CODES = new Set(["STRUCT_001"]);

function extractErrorCodes() {
  const src = readFileSync(join(repoRoot, "src/validate/errors.ts"), "utf8");
  const block = src.match(/export const ErrorCode = \{([\s\S]*?)\} as const;/);
  if (!block) throw new Error("Could not locate ErrorCode const in errors.ts");
  const codes = [];
  for (const line of block[1].split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+):\s*"/);
    if (m) codes.push(m[1]);
  }
  return codes;
}

function listFixtures() {
  const dir = join(repoRoot, "fixtures/invalid");
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function validateFixture(fixture) {
  const out = execFileSync(
    "node",
    [
      join(repoRoot, "dist/cli.js"),
      "validate",
      join(repoRoot, "fixtures/invalid", fixture),
      "--ds",
      join(repoRoot, "ds-catalog.example.yaml"),
    ],
    { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 }
  );
  return out;
}

const codes = extractErrorCodes().sort();
const fixtures = listFixtures();
let failed = false;

const codesWithoutFixture = codes.filter((c) => !STRUCTURAL_CODES.has(c) && !fixtures.includes(c));
const fixturesWithoutCode = fixtures.filter((f) => !codes.includes(f));

if (codesWithoutFixture.length > 0) {
  console.error(`ERROR: codes with no invalid fixture: ${codesWithoutFixture.join(", ")}`);
  failed = true;
}
if (fixturesWithoutCode.length > 0) {
  console.error(`ERROR: fixtures with no matching code: ${fixturesWithoutCode.join(", ")}`);
  failed = true;
}

console.log(`error codes: ${codes.length} (${codes.length - STRUCTURAL_CODES.size} fixture-backed)`);
console.log(`invalid fixtures: ${fixtures.length}`);

for (const fixture of fixtures) {
  let output = "";
  try {
    output = validateFixture(fixture);
  } catch (e) {
    // validate exits non-zero for error-severity fixtures; grab stdout from error
    output = e.stdout ? String(e.stdout) : "";
  }
  if (!output.includes(`[${fixture}]`)) {
    console.error(`FAIL: ${fixture} did not trigger expected code [${fixture}]`);
    console.error(output.trim() || "(no output)");
    failed = true;
  } else {
    console.log(`OK: ${fixture} triggers [${fixture}]`);
  }
}

if (failed) {
  process.exit(1);
}
console.log("All invalid fixtures verified against their codes");
