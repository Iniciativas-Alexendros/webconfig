# Findings: webconfig Implementation

## Specification Analysis

### Key Constraints from Spec
1. **Determinism is mandatory**: Same logical content → identical bytes. Enables git diffs and reproducibility.
2. **Fail-closed**: Any uncertainty (unknown prop, invalid pointer, missing asset) → validation FAILS with typed error code. Never silently ignored.
3. **No executable code in bundle**: Only data - component IDs from design system + serialized props/content.
4. **No secrets ever**: Validator must detect credential patterns (heuristics).
5. **DS catalog is external & data-driven**: Validator is generic, receives catalog as input, NO hardcoded component knowledge.
6. **Canonicalization recipe is exact**: YAML (recursive alpha sort, 2-space, LF, no anchors, UTF-8 no BOM), JSON (recursive key sort, 2-space, no trailing space).
7. **Property to test**: parse→serialize = identical bytes; different key insertion order → identical bytes.

### Format Structure (Frozen v1.0.0)
```
site.bundle/
├── manifest.yaml          (6 keys, alpha order)
├── site.config.yaml       (8 keys, alpha order)
├── composition/<page>.yaml
├── content/<locale>/<page>.json
├── content/seo/<locale>/<page>.yaml
└── assets/brand/ assets/media/
```

### Error Codes (24 total, all must be implemented)
| Code | Severity | Description |
|------|----------|-------------|
| PARENT_001 | error | parent_id doesn't exist in page |
| PARENT_002 | error | parent_id doesn't point to layout/* component |
| CONTENTREF_001 | error | content_ref null in non-layout/nav component |
| CONTENTREF_002 | error | content_ref format invalid per grammar |
| CONTENTREF_003 | error | pointer doesn't resolve in JSON root (locale or default) |
| I18N_002 | warning | content resolved via fallback |
| COMP_001 | error | unknown prop per DS catalog (fail-closed) |
| COMP_002 | error | component ID not in catalog |
| A11Y_001 | error | autoplay:true without pauseControl:true (WCAG 2.2.2) |
| PRICE_001 | error | price missing amount:number + currency:3 uppercase + period enum |
| ICON_001 | error | icon not in whitelist or emoji detected |
| ASSET_001 | error | referenced asset missing from bundle |
| ASSET_002 | warning | asset in bundle not referenced (orphan) |
| RICHTEXT_001 | error | HTML tag detected in rich-text field |
| LINK_001 | error | href with dead anchor (no target section on same page) |
| LINK_002 | error | href to undeclared slug in site.config.pages ("/" always valid) |
| LINK_003 | error | canonical doesn't follow {origin}/{locale}/{slug} pattern |
| SEO_001 | error | jsonLd missing @context or @type |
| SEO_002 | warning | title >60 chars or description >160 |
| SECRET_001 | error | secret pattern detected (apiKey=, token:, sk-, AKIA...) |
| MANIFEST_001 | error | missing/extra/duplicate keys in manifest |
| MANIFEST_002 | error | bundle_version not pure semver, or schema_compat not spec constraint |
| INTEGRITY_001 | error | file hash mismatch on recalculation |
| INTEGRITY_002 | error | global hash doesn't match recipe |
| CRYPTO_001 | warning | string that looks like credential in bundle |

### CLI Commands (Exact Behavior)
1. `webconfig validate <dir|.tar.gz> [--ds <yaml>] [--strict]`
   - Groups by severity, prints code/file/message
   - Exit 1 on errors; --strict also exits 1 on warnings
   - --ds defaults to parent dir ds-catalog.yaml, else usage error

2. `webconfig normalize <dir> [--check] [--write]`
   - --check: exit 1 if non-canonical (CI), no write
   - --write: normalize in-place

3. `webconfig export <dir> --out <bundle.tar.gz>`
   - Validates first (no export of invalid bundles)
   - Deterministic: sorted entries, epoch mtimes, gzip no timestamp
   - Two exports of same bundle = byte-identical tar

### Golden Fixture Requirements
- 3 pages: home, servicios, contacto
- Locales: es (complete), en (partial for fallback demo)
- SEO per page per locale
- Assets placeholders
- Dental content with prices (amount/currency/period)
- Icons from whitelist
- autoplay+pauseControl
- jsonLd with @context/@type
- Must pass validation: 0 errors, only I18N_002 warnings

### Stack (Frozen)
- TypeScript 5 strict, Node >=20, ESM
- Deps ONLY: zod, yaml, ajv + ajv-formats, commander, vitest, tsup, tar-stream
- PROHIBITED: js-yaml, any other dependency without justification
- Structure: src/cli.ts, src/load.ts, src/validate/, src/canonicalize.ts, src/integrity.ts, src/export/bundler.ts, schemas/, fixtures/, tests/, ds-catalog.example.yaml

## Implementation Notes

### Canonicalization Details
- YAML: Use `yaml` package with custom sortKeys (recursive, alphabetical)
- JSON: Custom replacer that sorts keys recursively
- Both: 2-space indent, LF line endings, UTF-8 no BOM
- Critical property: idempotency (double pass = identical bytes)

### Integrity Hashing
- files: Map of path → sha256hex of ALL bundle files EXCEPT manifest.yaml
- global: sha256 of concatenated hex values from files, sorted by path alphabetically
- No separators in concatenation

### Deterministic Tar (tar-stream)
- Entries sorted by path
- mtime = 0 (epoch)
- mode = 0o644 (files) / 0o755 (dirs)
- uid/gid = 0
- gzip: { mtime: 0 } to remove timestamp
- Two exports = byte-identical

### DS Catalog Format
- External YAML file
- Defines per component: id, valid props {name: "type | allowedValues"}, icon whitelist
- Validator loads at runtime, NO hardcoded knowledge

### Secret Detection Heuristics
Patterns: apiKey=, token:, sk-, AKIA..., and similar credential patterns
Must scan ALL files in bundle

## Questions for Clarification

1. **Content-ref grammar**: `"<page>.json#/<clave_raiz>"` - is the `<page>` part the same as the composition page slug? And `<clave_raiz>` is a top-level key in the JSON? The spec says "UN SOLO nivel" (single level) - so no nested pointers like `#/foo/bar`, only `#/key`?

2. **Parent_id validation**: "si no null DEBE apuntar a una sección de tipo layout/* de la misma página" - how do we know a component is layout/*? From the DS catalog? The catalog should have component types or naming convention?

3. **Fallback policy**: "fallback_to_default" - applies to both content and SEO. When a key is missing in non-default locale, use default locale value. Warning I18N_002 emitted.

4. **Price validation**: PROHIBIDO precio como string formateado ("29€/mes" → PRICE_001). Must be structured: {amount: number, currency: "EUR", period: "month"}

5. **Icons**: IDs string from DS catalog whitelist. Emojis prohibited in icon field (ICON_001). How to detect emoji? Unicode range check?

6. **Rich-text**: Only **bold** and [link](url) allowed. HTML tags → RICHTEXT_001. Need regex to detect HTML tags.

7. **Link validation**: 
   - LINK_001: href with anchor (#section) - target section must exist on same page
   - LINK_002: href to slug - must be declared in site.config.pages (or "/" for home)
   - LINK_003: canonical URL pattern check

8. **SEO jsonLd**: Native object with @context and @type REQUIRED. Additional properties allowed.

9. **Bundle version**: Pure semver "1.0.0" - no prerelease, no build metadata. schema_compat always "^1.0.0" (refers to spec version, not DS version).

10. **Manifest integrity.files**: ALL files except manifest.yaml. Does this include assets? Yes, all files in bundle.

## Research Needed
- [ ] Best approach for recursive key sorting in YAML/JSON with the `yaml` package
- [ ] tar-stream API for deterministic output
- [ ] AJV setup with JSON Schema draft 2020-12
- [ ] Emoji detection regex for ICON_001
- [ ] Secret detection patterns comprehensive list

## Decisions Documented in DECISIONS.md
(To be created during implementation)