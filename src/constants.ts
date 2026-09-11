export const BUNDLE_VERSION = "1.0.0";
export const SCHEMA_COMPAT = "^1.0.0";
export const SCHEMA_COMPAT_RE = /^~?\^?1\.0\.0$/;
export const BUNDLE_VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;
export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MAX = 160;
export const TAR_LIMITS = {
  maxFiles: 10_000,
  maxTotalBytes: 512 * 1024 * 1024,
} as const;
