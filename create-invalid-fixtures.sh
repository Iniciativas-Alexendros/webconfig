#!/bin/bash
set -e

BASE="/home/alexendros/repositorios/webconfig/fixtures/invalid"
DS_CATALOG="/home/alexendros/repositorios/webconfig/ds-catalog.example.yaml"

# Append a correct integrity section to a fixture manifest (recipe: all files
# except manifest.yaml, hashes sorted by path, no separators)
write_integrity() {
    local dir=$1
    local files hashes global_hash file h
    files=$(cd "$dir" && find . -type f ! -path './manifest.yaml' | sed 's|^\./||' | sort)
    hashes=""
    for file in $files; do
        h=$(cd "$dir" && sha256sum "$file" | awk '{print $1}')
        hashes="${hashes}${h}"
    done
    global_hash=$(printf '%s' "$hashes" | sha256sum | awk '{print $1}')
    {
        echo "integrity:"
        echo "  files:"
        for file in $files; do
            h=$(cd "$dir" && sha256sum "$file" | awk '{print $1}')
            echo "    \"$file\": \"$h\""
        done
        echo "  global: \"$global_hash\""
    } >> "$dir/manifest.yaml"
}

# Common template files
create_base() {
    local dir=$1
    mkdir -p "$dir/composition" "$dir/content/es" "$dir/content/seo/es" "$dir/assets/brand" "$dir/assets/media/images"
    
    # manifest.yaml
    cat > "$dir/manifest.yaml" <<MANIFEST
bundleVersion: "1.0.0"
createdAt: "2026-09-04T10:00:00.000Z"
description: "Test bundle for $2"
name: "$2"
siteConfig: "site.config.yaml"
updatedAt: "2026-09-04T10:00:00.000Z"
MANIFEST

    # site.config.yaml
    cat > "$dir/site.config.yaml" <<SITECONFIG
defaultLocale: "es"
fallbackLocale: "es"
locales:
  - "es"
name: "$2"
navigation:
  footer: []
  header: []
theme:
  colorScheme: "light"
  fontFamily: "Inter"
  radius: "md"
timezone: "UTC"
version: "1.0.0"
SITECONFIG

    # content/es/home.json
    cat > "$dir/content/es/home.json" <<CONTENT
{
  "blocks": [
    {
      "id": "test",
      "type": "text-block",
      "values": {
        "content": "Test content"
      }
    }
  ]
}
CONTENT

    # content/seo/es/home.yaml
    cat > "$dir/content/seo/es/home.yaml" <<SEO
canonical: "https://test.com/"
description: "Test"
jsonLd:
  "@context": "https://schema.org"
  "@type": "WebSite"
keywords: ["test"]
openGraph:
  description: "Test"
  title: "Test"
  type: "website"
title: "Test"
twitter:
  card: "summary"
  description: "Test"
  title: "Test"
SEO

    # placeholder assets
    touch "$dir/assets/brand/logo.svg" "$dir/assets/media/images/test.jpg"
}

# PARENT_001 - non-existent parent_id
create_base "$BASE/PARENT_001" "PARENT_001"
cat > "$BASE/PARENT_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "child"
    type: "text-block"
    parentId: "non-existent-parent"
    props:
      content: "Test content"
COMP

# PARENT_002 - parent_id not a layout
create_base "$BASE/PARENT_002" "PARENT_002"
cat > "$BASE/PARENT_002/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "content-parent"
    type: "text-block"
    parentId: null
    props:
      content: "Test content"
  - id: "child"
    type: "text-block"
    parentId: "content-parent"
    props:
      content: "Test content"
COMP

# CONTENTREF_001 - non-existent page in content ref
create_base "$BASE/CONTENTREF_001" "CONTENTREF_001"
cat > "$BASE/CONTENTREF_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      cta:
        label: "Test"
        href: "/"
      background:
        src: "assets/media/images/test.jpg"
        alt: "Test"
      contentRef: "non-existent.json#/key"
COMP

# CONTENTREF_002 - invalid pointer syntax
create_base "$BASE/CONTENTREF_002" "CONTENTREF_002"
cat > "$BASE/CONTENTREF_002/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      cta:
        label: "Test"
        href: "/"
      background:
        src: "assets/media/images/test.jpg"
        alt: "Test"
      contentRef: "invalid.json#/"
COMP

# CONTENTREF_003 - key not found in content
create_base "$BASE/CONTENTREF_003" "CONTENTREF_003"
cat > "$BASE/CONTENTREF_003/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      cta:
        label: "Test"
        href: "/"
      background:
        src: "assets/media/images/test.jpg"
        alt: "Test"
      contentRef: "es/home.json#/non-existent-key"
COMP

# I18N_002 - missing locale content
create_base "$BASE/I18N_002" "I18N_002"
cat > "$BASE/I18N_002/site.config.yaml" <<SITECONFIG
defaultLocale: "es"
fallbackLocale: "es"
locales:
  - "es"
  - "en"
name: "Test"
navigation:
  footer: []
  header: []
theme:
  colorScheme: "light"
  fontFamily: "Inter"
  radius: "md"
timezone: "UTC"
version: "1.0.0"
SITECONFIG
cat > "$BASE/I18N_002/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      cta:
        label: "Test"
        href: "/"
      background:
        src: "assets/media/images/test.jpg"
        alt: "Test"
COMP
# No content/en/home.json created

# COMP_001 - component type not in DS catalog
create_base "$BASE/COMP_001" "COMP_001"
cat > "$BASE/COMP_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "unknown"
    type: "non-existent-component"
    parentId: null
    props: {}
COMP

# COMP_002 - component props don't match schema
create_base "$BASE/COMP_002" "COMP_002"
cat > "$BASE/COMP_002/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      # missing required cta and background
COMP

# A11Y_001 - image missing alt
create_base "$BASE/A11Y_001" "A11Y_001"
cat > "$BASE/A11Y_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      cta:
        label: "Test"
        href: "/"
      background:
        src: "assets/media/images/test.jpg"
        # missing alt
COMP

# PRICE_001 - price missing fields
create_base "$BASE/PRICE_001" "PRICE_001"
cat > "$BASE/PRICE_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "price-table"
    type: "price-table"
    parentId: null
    props:
      plans:
        - name: "Test"
          price:
            amount: 100
            # missing currency and period
          features: []
          cta:
            label: "Test"
            href: "/"
COMP

# ICON_001 - icon not in whitelist
create_base "$BASE/ICON_001" "ICON_001"
cat > "$BASE/ICON_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "icon-list"
    type: "icon-list"
    parentId: null
    props:
      items:
        - icon: "non-existent-icon"
          text: "Test"
COMP

# ASSET_001 - referenced asset doesn't exist
create_base "$BASE/ASSET_001" "ASSET_001"
cat > "$BASE/ASSET_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      cta:
        label: "Test"
        href: "/"
      background:
        src: "assets/media/images/non-existent.jpg"
        alt: "Test"
COMP

# ASSET_002 - unused asset (base template ships unreferenced logo/test assets)
create_base "$BASE/ASSET_002" "ASSET_002"
cat > "$BASE/ASSET_002/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "text"
    type: "text-block"
    parentId: null
    props:
      content: "Test content"
COMP

# RICHTEXT_001 - HTML in rich text
create_base "$BASE/RICHTEXT_001" "RICHTEXT_001"
cat > "$BASE/RICHTEXT_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "text"
    type: "text-block"
    parentId: null
    props:
      content: "<script>alert('xss')</script>"
COMP

# LINK_001 - internal link to non-existent page
create_base "$BASE/LINK_001" "LINK_001"
cat > "$BASE/LINK_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      cta:
        label: "Test"
        href: "/non-existent-page"
      background:
        src: "assets/media/images/test.jpg"
        alt: "Test"
COMP

# LINK_002 - external link uses http
create_base "$BASE/LINK_002" "LINK_002"
cat > "$BASE/LINK_002/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      cta:
        label: "Test"
        href: "http://example.com"
      background:
        src: "assets/media/images/test.jpg"
        alt: "Test"
COMP

# LINK_003 - anchor link to non-existent element
create_base "$BASE/LINK_003" "LINK_003"
cat > "$BASE/LINK_003/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "hero"
    type: "hero"
    parentId: null
    props:
      headline: "Test"
      cta:
        label: "Test"
        href: "#NonExistentAnchor"
      background:
        src: "assets/media/images/test.jpg"
        alt: "Test"
COMP

# SEO_001 - title/description too long
create_base "$BASE/SEO_001" "SEO_001"
cat > "$BASE/SEO_001/content/seo/es/home.yaml" <<SEO
canonical: "https://test.com/"
description: "$(printf 'x%.0s' {1..200})"
jsonLd:
  "@context": "https://schema.org"
  "@type": "WebSite"
keywords: ["test"]
openGraph:
  description: "$(printf 'x%.0s' {1..200})"
  title: "$(printf 'x%.0s' {1..100})"
  type: "website"
title: "$(printf 'x%.0s' {1..100})"
twitter:
  card: "summary"
  description: "Test"
  title: "Test"
SEO

# SEO_002 - jsonLd missing @context/@type
create_base "$BASE/SEO_002" "SEO_002"
cat > "$BASE/SEO_002/content/seo/es/home.yaml" <<SEO
canonical: "https://test.com/"
description: "Test"
jsonLd:
  foo: "bar"
keywords: ["test"]
openGraph:
  description: "Test"
  title: "Test"
  type: "website"
title: "Test"
twitter:
  card: "summary"
  description: "Test"
  title: "Test"
SEO

# SECRET_001 - secret detected
create_base "$BASE/SECRET_001" "SECRET_001"
cat > "$BASE/SECRET_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "text"
    type: "text-block"
    parentId: null
    props:
      content: "AKIA1234567890123456"
COMP

# MANIFEST_001 - manifest references non-existent site.config
create_base "$BASE/MANIFEST_001" "MANIFEST_001"
cat > "$BASE/MANIFEST_001/manifest.yaml" <<MANIFEST
bundleVersion: "1.0.0"
createdAt: "2026-09-04T10:00:00.000Z"
description: "Test bundle for MANIFEST_001"
name: "MANIFEST_001"
siteConfig: "non-existent.yaml"
updatedAt: "2026-09-04T10:00:00.000Z"
MANIFEST

# MANIFEST_002 - bundleVersion mismatch
create_base "$BASE/MANIFEST_002" "MANIFEST_002"
cat > "$BASE/MANIFEST_002/manifest.yaml" <<MANIFEST
bundleVersion: "2.0.0"
createdAt: "2026-09-04T10:00:00.000Z"
description: "Test bundle for MANIFEST_002"
name: "MANIFEST_002"
siteConfig: "site.config.yaml"
updatedAt: "2026-09-04T10:00:00.000Z"
MANIFEST

# INTEGRITY_001 - file hash mismatch (tamper applied after integrity pass)
create_base "$BASE/INTEGRITY_001" "INTEGRITY_001"
cat > "$BASE/INTEGRITY_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "text"
    type: "text-block"
    parentId: null
    props:
      content: "Test content"
COMP

# INTEGRITY_002 - global hash mismatch (tamper applied after integrity pass)
create_base "$BASE/INTEGRITY_002" "INTEGRITY_002"
cat > "$BASE/INTEGRITY_002/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "text"
    type: "text-block"
    parentId: null
    props:
      content: "Test content"
COMP

# CRYPTO_001 - weak crypto pattern
create_base "$BASE/CRYPTO_001" "CRYPTO_001"
cat > "$BASE/CRYPTO_001/composition/home.yaml" <<COMP
page: "home"
components:
  - id: "text"
    type: "text-block"
    parentId: null
    props:
      content: "api_key = secret123"
COMP

# Write correct integrity into every fixture manifest, then tamper INTEGRITY fixtures
for dir in "$BASE"/*/; do
    write_integrity "$dir"
done

# INTEGRITY_001: tamper one file AFTER integrity was computed (manifest untouched)
# Uses an asset file (not parsed) so only the hash mismatch fires
printf 'tampered' >> "$BASE/INTEGRITY_001/assets/brand/logo.svg"

# INTEGRITY_002: alter the global hash AFTER integrity was computed (files untouched)
sed -i 's/^  global: .*/  global: "0000000000000000000000000000000000000000000000000000000000000000"/' "$BASE/INTEGRITY_002/manifest.yaml"

# Self-verify: every fixture must trigger its own error code (fail at generation if not)
CLI="/home/alexendros/repositorios/webconfig/dist/cli.js"
if [ -f "$CLI" ]; then
    for dir in "$BASE"/*/; do
        code=$(basename "$dir")
        if ! node "$CLI" validate "$dir" --ds "$DS_CATALOG" 2>&1 | grep -q "\[$code\]"; then
            echo "ERROR: fixture $code does not trigger [$code]" >&2
            exit 1
        fi
    done
    echo "Self-verification passed: all $(ls -d "$BASE"/*/ | wc -l) fixtures trigger their codes"
else
    echo "Skipping self-verification: $CLI not built (run npm run build first)"
fi

echo "All invalid fixtures created!"
