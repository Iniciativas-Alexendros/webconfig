# Task Plan: webconfig - site.bundle v1.0.0 Validator & Exporter

## Project Overview
Build a TypeScript CLI tool (`webconfig`) that implements the validator and exporter for the canonical "site.bundle" v1.0.0 format. The tool validates, normalizes, and packages bundles used by a visual web builder and CI/CD pipeline.

## Goal
Deliver a complete, tested, and documented implementation following the 7-phase specification with all error codes, deterministic serialization, CLI commands, and CI/CD integration.

## Phases

### Phase 1: Scaffolding [PENDING]
**Objective**: Initialize git repo, package.json (exact versions, private), tsconfig, dependencies, folder structure, config files
- [ ] `git init` on main branch
- [ ] Create `package.json` with:
  - name: "webconfig"
  - bin: "webconfig"
  - engines: node >=20
  - type: "module"
  - private: true
  - dependencies: **EXACT versions (no ^)**: zod@3.22.4, yaml@2.3.4, ajv@8.12.0, ajv-formats@2.1.1, commander@11.1.0, tar-stream@3.1.6
  - devDependencies: **EXACT versions**: vitest@1.2.0, tsup@8.0.1, typescript@5.3.3, @types/node@20.11.0
- [ ] Create `tsconfig.json` with strict mode
- [ ] Create directory structure: `src/`, `schemas/`, `fixtures/golden/`, `fixtures/invalid/`, `tests/`
- [ ] Create `.gitignore` (node_modules, dist, *.tar.gz)
- [ ] Create `.npmrc` with `engine-strict=true`
- [ ] Create `.nvmrc` with `20`
- [ ] Create `DECISIONS.md` empty with header
- [ ] Run `npm install` → generates `package-lock.json` (commit it)
- [ ] Commit: "chore: bootstrap webconfig"

### Phase 2: Schemas & Golden Fixture [PENDING]
**Objective**: Create 5 JSON Schemas + well-formed golden fixture bundle (parseable, structure present)
- [ ] JSON Schema for `manifest.yaml` (6 keys, exact structure, alpha order)
- [ ] JSON Schema for `site.config.yaml` (8 keys, exact structure, alpha order)
- [ ] JSON Schema for `composition/<page>.yaml`
- [ ] JSON Schema for `content/<locale>/<page>.json`
- [ ] JSON Schema for `content/seo/<locale>/<page>.yaml`
- [ ] All schemas: $id, version "1.0.0", draft 2020-12
- [ ] Create golden fixture: `fixtures/golden/clinica-dental-sur/`
  - 3 pages: home, servicios, contacto
  - Locales: es (complete), en (partial for fallback demo)
  - SEO per page per locale
  - Assets placeholders (brand/logo, media/images)
  - Realistic dental content with prices (amount/currency/period)
  - Icons from whitelist, autoplay+pauseControl
  - jsonLd with @context/@type
- [ ] Create `ds-catalog.example.yaml` with component definitions
  - **MANDATORY `category` per component**: closed enum (layout|nav|content|form|media)
  - Layout detection via `category: "layout"`, NOT by ID prefix
- [ ] Golden fixture: well-formed (parses correctly, structure present) — **validation is Phase 4 checkpoint**
- [ ] Commit: "feat: add JSON schemas and golden fixture"

### Phase 3: Canonicalize + Integrity [PENDING]
**Objective**: Deterministic serializers + integrity hashing + normalize CLI
- [ ] `src/canonicalize.ts`: YAML serializer (recursive sortKeys, 2-space indent, LF, no anchors, UTF-8 no BOM)
- [ ] `src/canonicalize.ts`: JSON serializer (recursive key sort, 2-space indent, no trailing space)
- [ ] Property test: parse(bytes) → serialize() = identical bytes
- [ ] Property test: different key insertion order → identical bytes
- [ ] `src/integrity.ts`: sha256 per file + global hash (concatenated sorted hex values)
- [ ] CLI: `webconfig normalize <dir> [--check] [--write]`
  - --check: exit 1 if non-canonical, no write
  - --write: normalize in-place
- [ ] Tests for canonicalization idempotency (double pass = byte-identical)
- [ ] Commit: "feat: canonicalize and integrity"

### Phase 4: Validator [PENDING]
**Objective**: Syntax (AJV) + Semantic (all error codes) + DS catalog loader
- [ ] `src/validate/syntax.ts`: AJV validation against JSON Schemas
- [ ] `src/validate/errors.ts`: Error types matching Table 4 (all 24 codes)
- [ ] `src/validate/semantic.ts`: Pure function implementing ALL error codes:
  - PARENT_001, PARENT_002 (parent_id validation via `category: "layout"`)
  - CONTENTREF_001, CONTENTREF_002, CONTENTREF_003
  - I18N_002 (warning)
  - COMP_001, COMP_002
  - A11Y_001
  - PRICE_001
  - ICON_001
  - ASSET_001, ASSET_002 (warning)
  - RICHTEXT_001
  - LINK_001, LINK_002, LINK_003
  - SEO_001, SEO_002 (warning)
  - SECRET_001
  - MANIFEST_001, MANIFEST_002
  - INTEGRITY_001, INTEGRITY_002
  - CRYPTO_001 (warning)
- [ ] DS catalog loader: generic, no hardcoded components, uses `category` field
- [ ] Create `fixtures/invalid/<CODE>/` - one corrupt bundle per error code
- [ ] Tests: each invalid fixture triggers EXACTLY its error code
- [ ] CLI: `webconfig validate <dir|.tar.gz> [--ds <yaml>] [--strict] [--json]`
  - Groups results by severity, prints code/file/message
  - Exit 1 on errors; --strict also exits 1 on warnings
  - --ds defaults to parent dir ds-catalog.yaml, else usage error
  - **--json: outputs {errors, warnings} parseable for pipeline consumption**
- [ ] Golden fixture validation: 0 errors, only I18N_002 warnings
- [ ] Commit: "feat: complete validator with all error codes"

### Phase 5: CLI + Export [PENDING]
**Objective**: All 3 commands + deterministic tar.gz + round-trip test + integration tests
- [ ] `src/cli.ts`: Commander setup for validate/normalize/export
- [ ] `src/load.ts`: Load bundle from directory or .tar.gz
- [ ] `src/export/bundler.ts`: Deterministic tar.gz
  - Entries sorted by path
  - mtimes = epoch (0)
  - gzip without timestamp
  - uid/gid fixed
- [ ] Property: two exports of same bundle = byte-identical tar.gz
- [ ] Round-trip test: validate(export(normalize(golden))) = valid + bytes identical
- [ ] **Integration tests via execFile of compiled binary**: at least validate and export
- [ ] Commit: "feat: CLI commands and deterministic export"

### Phase 6: CI + GitHub [PENDING]
**Objective**: GitHub Actions workflow, README, CHANGELOG, remote repo
- [ ] `.github/workflows/ci.yml`:
  - On push/PR: checkout, setup-node 20, npm ci
  - typecheck (tsc --noEmit)
  - test (npm test)
  - validate golden fixture
  - normalize --check golden fixture
- [ ] `README.md`: what is webconfig, install, 3 commands (incl --json), error codes table, "add component to DS" guide
- [ ] `CHANGELOG.md`: frozen spec decisions + **5 frozen answers in "Decisiones congeladas" section**
- [ ] `DECISIONS.md`: any implementation decisions not covered by spec
- [ ] If gh authenticated: create repo "webconfig" and push (ask user: private/public/org)
- [ ] If no gh: provide exact command to run
- [ ] Configure main as default branch
- [ ] Commit: "chore: CI, docs, and GitHub setup"

### Phase 7: Final Verification [PENDING]
**Objective**: Complete checklist verification with evidence
- [ ] `npm test`: 100% green, ≥1 test per error code
- [ ] Golden bundle: validate → 0 errors, only expected I18N_002
- [ ] `grep -ri "clinica" src/` → 0 results
- [ ] Normalize idempotent: double pass byte-identical
- [ ] Export produces reproducible tar (two runs = same sha256)
- [ ] CI workflow syntactically valid (actionlint)
- [ ] README covers 3 commands and error codes table
- [ ] No secrets, stubs, TODOs in repo
- [ ] Commit: "chore: final verification"

## Next Step
Initialize the project with Phase 1 scaffolding (git, package.json with exact versions, tsconfig, folder structure, .npmrc, .nvmrc, DECISIONS.md).

## Decisions Made (Frozen Answers from Spec)
| Date | Decision | Alternatives | Reason |
|------|----------|--------------|--------|
| 2026-09-04 | Use `yaml` package (not js-yaml) | js-yaml | Spec explicitly prohibits js-yaml |
| 2026-09-04 | Use `tar-stream` for deterministic tar | node:fs + zlib | Spec requires tar-stream |
| 2026-09-04 | ESM only (type: module) | CommonJS | Spec: TypeScript 5 strict, Node >=20, ESM |
| 2026-09-04 | No external deps beyond spec list | Additional utils | Spec: PROHIBIDO añadir otra dependencia |
| 2026-09-04 | **Content-ref grammar**: `<page>.json#/<clave_raiz>` — `<page>` = slug from composition, `<clave_raiz>` = top-level key only (single level, no nesting) | Nested pointers | Spec: "UN SOLO nivel, pointers multinivel NO soportados v1.0 → fail-closed" |
| 2026-09-04 | **Parent_id → layout/**: DS catalog has mandatory `category` field (layout|nav|content|form|media); detection via `category === "layout"`, never by ID prefix | ID prefix heuristic | Spec rectification: "category en ds-catalog es OBLIGATORIA... detección por ese campo, nunca por prefijo del ID" |
| 2026-09-04 | **ICON_001 emoji detection**: Primary = whitelist from DS catalog; Secondary = Unicode regex `/\p{Extended_Pictographic}/u` (NOT `\p{Emoji}` — matches digits, #, *) | \p{Emoji} regex | \p{Emoji} over-matches; Extended_Pictographic is precise for emoji/pictographs |
| 2026-09-04 | **SECRET_001 / CRYPTO_001**: Data-driven array of `{pattern: RegExp, code: "SECRET_001"|"CRYPTO_001", severity: "error"|"warning"}` with exact frozen patterns: **SECRET_001 (error)**: `AKIA[0-9A-Z]{16}`, `(sk\|pk)-[A-Za-z0-9]{20,}`, `ghp_\|gho_[A-Za-z0-9]{36}`, `github_pat_`, `xox[abprs]-`, `glpat-`, `-----BEGIN .* PRIVATE KEY-----`, `Authorization: Bearer \S{20,}`; **CRYPTO_001 (warning)**: `(?i)(api[_-]?key\|secret\|token\|password\|passwd\|pwd)\s*[=:] \s*\S+` (ambiguous context) | Flat keyword list | Data-driven, precise regexes avoid false positives; separate error vs warning by confidence |
| 2026-09-04 | **RICHTEXT_001 HTML detection**: Regex `/<[^>]+>/` on rich-text fields (not full parser) | HTML parser | Spec: "etiquetas HTML detectadas" — regex sufficient for detection |
| 2026-09-04 | **Package privacy**: `"private": true` in package.json unless user indicates otherwise | Public package | Spec rectification |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | - | - |

## Files Created/Modified
| File | Status |
|------|--------|
| task_plan.md | ✅ Updated with rectifications + corrections A & B |
| findings.md | ✅ Created |
| progress.md | ✅ Created |
| package.json | ⏳ Pending |
| tsconfig.json | ⏳ Pending |
| src/ | ⏳ Pending |
| schemas/ | ⏳ Pending |
| fixtures/ | ⏳ Pending |
| tests/ | ⏳ Pending |
| .npmrc | ⏳ Pending |
| .nvmrc | ⏳ Pending |
| DECISIONS.md | ⏳ Pending |