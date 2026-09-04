# webconfig

CLI tool for validating, normalizing, and exporting "site.bundle" v1.0.0 format used by visual web builders and CI/CD pipelines.

## Installation

```bash
npm install
npm run build
```

The binary will be available at `dist/cli.js` or installed globally via `npm link`.

## Commands

### `webconfig validate <bundle> [options]`

Validate a site.bundle directory or .tar.gz file.

**Options:**
- `--ds <path>` - Path to ds-catalog.yaml (defaults to parent directory)
- `--strict` - Exit 1 on warnings as well as errors
- `--json` - Output JSON for pipeline consumption

**Exit codes:**
- 0: Valid (no errors, or only warnings if not --strict)
- 1: Invalid (errors found, or warnings with --strict)

**Example:**
```bash
webconfig validate ./my-bundle --ds ./ds-catalog.yaml --json
```

### `webconfig normalize <dir> [options]`

Normalize YAML/JSON files in a bundle to canonical form (deterministic serialization).

**Options:**
- `--check` - Exit 1 if non-canonical, do not write
- `--write` - Normalize files in-place

**Example:**
```bash
webconfig normalize ./my-bundle --write
webconfig normalize ./my-bundle --check
```

### `webconfig export <bundle> <output>`

Export a site.bundle directory to a deterministic .tar.gz file.

**Features:**
- Entries sorted by path
- mtimes set to epoch (0)
- gzip without timestamp
- uid/gid fixed

**Example:**
```bash
webconfig export ./my-bundle ./my-bundle.tar.gz
```

### `webconfig integrity <dir>`

Compute integrity hashes for a bundle (sha256 per file + global hash).

## Error Codes

| Code | Severity | Description |
|------|----------|-------------|
| PARENT_001 | error | Component references non-existent parent_id |
| PARENT_002 | error | parent_id must reference a layout component (category: layout) |
| CONTENTREF_001 | error | Content reference points to non-existent page |
| CONTENTREF_002 | error | Content reference uses invalid pointer syntax |
| CONTENTREF_003 | error | Content reference key not found in target content file |
| I18N_002 | warning | Locale missing in content; will fallback to defaultLocale |
| COMP_001 | error | Component type not found in DS catalog |
| COMP_002 | error | Component props do not match DS catalog schema |
| A11Y_001 | error | Image missing alt text |
| PRICE_001 | error | Price missing amount, currency, or period |
| ICON_001 | error | Icon not in whitelist and not a valid Unicode pictograph |
| ASSET_001 | error | Referenced asset file does not exist |
| ASSET_002 | warning | Asset file exists but is not referenced anywhere |
| RICHTEXT_001 | error | HTML tags detected in rich-text field |
| LINK_001 | error | Internal link points to non-existent page |
| LINK_002 | error | External link uses http: (must be https:) |
| LINK_003 | error | Anchor link points to non-existent element ID |
| SEO_001 | error | SEO title or description exceeds recommended length |
| SEO_002 | warning | SEO jsonLd missing required @context or @type |
| SECRET_001 | error | Potential secret detected (API key, token, private key) |
| MANIFEST_001 | error | Manifest references non-existent site.config.yaml |
| MANIFEST_002 | error | Manifest bundleVersion does not match schema version |
| INTEGRITY_001 | error | File integrity hash mismatch |
| INTEGRITY_002 | error | Global integrity hash mismatch |
| CRYPTO_001 | warning | Weak cryptographic pattern detected (ambiguous context) |

## Adding a Component to DS Catalog

1. Edit `ds-catalog.yaml` (or your custom catalog file)
2. Add a new component entry with:
   - `id`: Unique identifier
   - `name`: Human-readable name
   - `category`: One of `layout`, `nav`, `content`, `form`, `media`
   - `description`: Optional description
   - `propsSchema`: JSON Schema for component props

3. For icons, add an `icon` property to `propsSchema` with an `enum` of allowed icon names.

4. Layout components must have `category: "layout"` (used for parent_id validation).

Example:
```yaml
components:
  - id: "my-component"
    name: "My Custom Component"
    category: "content"
    description: "A custom content component"
    propsSchema:
      type: object
      properties:
        title:
          type: string
        icon:
          type: string
          enum: ["star", "heart", "user"]
      required: ["title"]
```

## Deterministic Output

All operations are deterministic:
- `normalize` produces byte-identical output regardless of input key order
- `export` produces byte-identical .tar.gz files for the same input
- `integrity` computes stable sha256 hashes

## Requirements

- Node.js >= 20
- ESM only (type: module)

## License

MIT