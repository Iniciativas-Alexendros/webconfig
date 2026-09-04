# 1.0.0 (2026-09-04)


### Bug Fixes

* commit package-lock.json for CI reproducibility ([2746115](https://github.com/Iniciativas-Alexendros/webconfig/commit/274611584ed6218b92f8f7ebe89b4d86858aff4c))
* handle validate exit codes in CI fixture checks (set +e) ([9ca1a1b](https://github.com/Iniciativas-Alexendros/webconfig/commit/9ca1a1b0295fdca8930c70abe03996ce4f39c737))
* reorder CI build/test, fix COMP_002 props validation, fix fixture CI checks ([127c559](https://github.com/Iniciativas-Alexendros/webconfig/commit/127c5591ff215727561fd396b3850ea0c571be9d))


### Features

* add JSON schemas and golden fixture ([46b2a29](https://github.com/Iniciativas-Alexendros/webconfig/commit/46b2a29c6d8c23417c638bed90bbd67c2ded0767))
* canonicalize and integrity ([b520e3c](https://github.com/Iniciativas-Alexendros/webconfig/commit/b520e3ccbc5683048236957cbed397f059608650))
* complete CLI commands and deterministic export ([e927be6](https://github.com/Iniciativas-Alexendros/webconfig/commit/e927be6a045197c5a923d25eacff1703c2edc028))
* complete validator with all error codes ([0119020](https://github.com/Iniciativas-Alexendros/webconfig/commit/01190207b942a47f4f9db5d3dd491b5ab04397d8))
* complete validator with all error codes and invalid fixtures ([bd92fc4](https://github.com/Iniciativas-Alexendros/webconfig/commit/bd92fc468542632ee66246933dac569d257d2e5b))

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
