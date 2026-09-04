# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-04

### Added
- Initial release of webconfig v1.0.0
- `validate` command: validates site.bundle directories and .tar.gz files
- `normalize` command: canonicalizes YAML/JSON files with deterministic serialization
- `export` command: creates deterministic .tar.gz bundles
- `integrity` command: computes file and global integrity hashes
- Complete validator with all 24 error codes (PARENT, CONTENTREF, I18N, COMP, A11Y, PRICE, ICON, ASSET, RICHTEXT, LINK, SEO, SECRET, MANIFEST, INTEGRITY, CRYPTO)
- DS catalog loader using mandatory `category` field (layout|nav|content|form|media)
- Deterministic serialization: YAML/JSON key sorting, stable tar.gz output
- Integration tests for validate and export commands
- GitHub Actions CI workflow

### Decisiones congeladas
1. **Content-ref grammar**: `<page>.json#/<clave_raiz>` — `<page>` = slug from composition, `<clave_raiz>` = top-level key only (single level, no nesting)
2. **Parent_id → layout/**: DS catalog has mandatory `category` field (layout|nav|content|form|media); detection via `category === "layout"`, never by ID prefix
3. **ICON_001 emoji detection**: Primary = whitelist from DS catalog; Secondary = Unicode regex `/\p{Extended_Pictographic}/u` (NOT `\p{Emoji}`)
4. **SECRET_001 / CRYPTO_001**: Data-driven array of `{pattern: RegExp, code, severity}` with exact frozen patterns
5. **Package privacy**: `"private": true` in package.json

## [Unreleased]

### Changed
- Updated README with complete command documentation
- Added GitHub Actions CI workflow
- Created CHANGELOG.md and DECISIONS.md