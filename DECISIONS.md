# Implementation Decisions

This document records implementation decisions not explicitly covered by the frozen specification.

## Architecture

### ESM Only
- Used `type: "module"` in package.json
- All imports use `.js` extensions
- No CommonJS compatibility layer

### No External Dependencies Beyond Spec
Strictly adhered to the approved dependency list:
- Runtime: zod, yaml, ajv, ajv-formats, commander, tar-stream
- Dev: vitest, tsup, typescript, @types/node

## Validator Design

### Separation of Syntax vs Semantic Validation
- `syntax.ts`: AJV-based JSON Schema validation
- `semantic.ts`: Pure TypeScript functions implementing all 24 error codes
- `index.ts`: Orchestrates both, handles bundle loading

This separation allows:
- Independent testing of syntax vs semantic rules
- Clear error categorization
- Potential future optimization (e.g., skip semantic if syntax fails)

### DS Catalog Loading
- Generic loader in `ds-catalog.ts` with no hardcoded components
- Uses `category` field exclusively for layout detection
- Icon whitelist extracted from catalog `propsSchema` enums
- Validates mandatory `category` field on load

### Content Reference Resolution
- Grammar: `<page>.json#/<clave_raiz>` (single level only)
- Resolves across all locales, checking each locale's content file
- Page slug extracted from reference, matched against composition page slugs

### Asset Validation
- `ASSET_001`: Referenced asset must exist in bundle
- `ASSET_002` (warning): Unreferenced asset files flagged
- Scans compositions, content blocks, and SEO for asset references

### Secret Detection
- `SECRET_001` (error): High-confidence patterns (AWS keys, GitHub tokens, private keys, etc.)
- `CRYPTO_001` (warning): Ambiguous patterns (api_key=, secret=, etc.)
- Data-driven regex array for maintainability

## Canonicalization

### YAML Serialization
- Uses `yaml` package (not js-yaml)
- Recursive key sorting (alphabetical)
- 2-space indent, LF line endings
- No anchors/aliases
- UTF-8 without BOM

### JSON Serialization
- Recursive key sorting
- 2-space indent
- No trailing spaces

### Idempotency
- Double-pass normalization produces byte-identical output
- Property tests verify parse → serialize = identity

## Export

### Deterministic tar.gz
- Uses `tar-stream` for streaming tar creation
- Entries sorted by path (lexicographic)
- mtimes = epoch (0)
- gzip level 9, no timestamp
- uid/gid = 0
- Entries added in sorted order for byte-identical output

### Bundle Loading
- Supports both directory and .tar.gz input
- Extracts .tar.gz to temporary directory with cleanup
- Preserves directory structure in tar entries

## CLI

### Integrity Command (retroactive documentation)
- **Date**: 2026-09-04 (introduced in `b520e3c` "feat: canonicalize and integrity")
- **Motivation**: give operators a cheap way to detect content tampering between development and publishing, complementing the manifest `integrity` section validated by the validator
- **Impact**: CLI grows from 3 to 4 commands (`validate`, `normalize`, `export`, `integrity`); no change to the bundle format
- **Status**: `ADDITION-v1.1` — **ratificado** como parte de la spec del formato site.bundle.
- **Ratificación**: 2026-09-05. Ratificación afirmativa del comando `integrity` como `ADDITION-v1.1` (entra en la spec del formato a partir de v1.1.0; no se promueve a `schemas/` en v1.0.x). El comando es una capacidad de la herramienta que queda ligada a la sección `integrity` del manifest, ya validada por el validador.

## Version Contract

### Separate Versioning (frozen)
- `package.json` `version` = version of the **tool** (webconfig); managed exclusively by semantic-release
- `schemas/` and `schema_compat` = version of the **site.bundle format**; stays at `1.0.0` unless changed by manual decision. Format versions are never auto-bumped by release tooling
- `schemas/` and the error-code table must not be modified without a written proposal in this file first

### schema_compat Restored (deviation fixed)
- **Date**: 2026-09-05
- `schema_compat` ausente en schema y validador = desviación; este cambio **RESTAURA el contrato v1.0.0**, no lo modifica.
- `schemas/manifest.schema.json` now REQUIRES `schema_compat` with pattern `^~?\^?1\.0\.0$` (accepts `^1.0.0`/`1.0.0`; rejects `>=`, `1.x`, and any 2+ version).
- Semantic layer `MANIFEST_002` now also fires for: `bundleVersion` that is not pure semver, and `schema_compat` present but incompatible with spec 1.0.0 (`Incompatible schema_compat constraint: <value>`).
- Separation of responsibilities (tested): missing `schema_compat` → `MANIFEST_001` (required field, syntax/AJV layer); incompatible `schema_compat` → `MANIFEST_002` (semantic layer).
- Commit: this commit (`fix(validator): enforce schema_compat per frozen spec v1.0.0`)

## Testing Strategy

### Unit Tests
- Canonicalization: 23 tests (idempotency, key sorting, YAML/JSON)
- Export: 5 tests (determinism, round-trip, bundle loading, I18N_002 per-key content/seo)
- Integration: 5 tests (CLI validate, validate --json, export, validate exported, fail-closed JSON)
- Integrity: 3 tests (INTEGRITY_001 per-file, INTEGRITY_002 global, golden passes)
- Manifest: 3 tests (schema_compat required → MANIFEST_001, incompatible → MANIFEST_002, golden passes)

### Test Fixtures
- Golden fixture: `fixtures/golden/clinica-dental-sur/` (valid bundle)
- Invalid fixtures: `fixtures/invalid/<CODE>/` (one per error code)

### Golden Fixture
- 3 pages: home, servicios, contacto
- Locales: es (complete), en (complete)
- SEO per page per locale
- Assets: placeholders for brand/logo, media/images
- Realistic dental content with prices
- Icons from whitelist, autoplay+pauseControl

## CI/CD

### GitHub Actions Workflow
- Runs on push/PR to main
- Node.js 20, npm ci
- Typecheck (tsc --noEmit)
- Tests (npm test)
- Validate golden fixture
- Normalize --check golden fixture

### Release (semantic-release)
- Package is `private: true`; release = git tag + GitHub Release only (no npm publish)
- `@semantic-release/npm` is intentionally **not** used (nothing to publish)
- `@semantic-release/git` commits `CHANGELOG.md` (and `package.json` when the version changes)
- `@semantic-release/github` creates the GitHub Release
- Expected secrets: only `GH_TOKEN` (a GitHub token with repo scope). `NPM_TOKEN` is not required.

## Package Configuration

### package.json
- `"private": true` (not published to npm)
- `"type": "module"` (ESM)
- `"bin": "webconfig"` (entry point)
- `"engines": { "node": ">=20" }`
- Exact dependency versions (no ^ or ~)

### TypeScript Config
- Strict mode enabled
- ESM target (ES2022)
- Declaration files generated

## Known Limitations

1. **INTEGRITY_001/002**: Implemented in v1.0.0 (per-file sha256 declared in `manifest.yaml` integrity.files plus a global hash over the path-sorted concatenated hashes; manifest.yaml itself is excluded from the hashed set).
2. **Content references in SEO**: Not validated (only composition/content)
3. **Anchor link validation**: Basic pattern matching only
4. **Performance**: No caching for large bundles (acceptable for v1)

## Future Considerations

1. Add watch mode for development
2. Support for incremental validation
3. JSON Schema draft-2020-12 meta-schema bundling
5. WebAssembly port for performance