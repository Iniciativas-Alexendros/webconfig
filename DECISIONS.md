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

## Testing Strategy

### Unit Tests
- Canonicalization: 23 tests (idempotency, key sorting, YAML/JSON)
- Export: 3 tests (determinism, round-trip, bundle loading)
- Integration: 4 tests (CLI validate, validate --json, export, validate exported)

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