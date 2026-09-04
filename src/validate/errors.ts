export type Severity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  severity: Severity;
  file: string;
  message: string;
  location?: {
    line?: number | undefined;
    column?: number | undefined;
  } | undefined;
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  valid: boolean;
}

export const ErrorCode = {
  PARENT_001: "PARENT_001",
  PARENT_002: "PARENT_002",
  CONTENTREF_001: "CONTENTREF_001",
  CONTENTREF_002: "CONTENTREF_002",
  CONTENTREF_003: "CONTENTREF_003",
  I18N_002: "I18N_002",
  COMP_001: "COMP_001",
  COMP_002: "COMP_002",
  A11Y_001: "A11Y_001",
  PRICE_001: "PRICE_001",
  ICON_001: "ICON_001",
  ASSET_001: "ASSET_001",
  ASSET_002: "ASSET_002",
  RICHTEXT_001: "RICHTEXT_001",
  LINK_001: "LINK_001",
  LINK_002: "LINK_002",
  LINK_003: "LINK_003",
  SEO_001: "SEO_001",
  SEO_002: "SEO_002",
  SECRET_001: "SECRET_001",
  MANIFEST_001: "MANIFEST_001",
  MANIFEST_002: "MANIFEST_002",
  INTEGRITY_001: "INTEGRITY_001",
  INTEGRITY_002: "INTEGRITY_002",
  CRYPTO_001: "CRYPTO_001",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorSeverity: Record<ErrorCode, Severity> = {
  [ErrorCode.PARENT_001]: "error",
  [ErrorCode.PARENT_002]: "error",
  [ErrorCode.CONTENTREF_001]: "error",
  [ErrorCode.CONTENTREF_002]: "error",
  [ErrorCode.CONTENTREF_003]: "error",
  [ErrorCode.I18N_002]: "warning",
  [ErrorCode.COMP_001]: "error",
  [ErrorCode.COMP_002]: "error",
  [ErrorCode.A11Y_001]: "error",
  [ErrorCode.PRICE_001]: "error",
  [ErrorCode.ICON_001]: "error",
  [ErrorCode.ASSET_001]: "error",
  [ErrorCode.ASSET_002]: "warning",
  [ErrorCode.RICHTEXT_001]: "error",
  [ErrorCode.LINK_001]: "error",
  [ErrorCode.LINK_002]: "error",
  [ErrorCode.LINK_003]: "error",
  [ErrorCode.SEO_001]: "error",
  [ErrorCode.SEO_002]: "warning",
  [ErrorCode.SECRET_001]: "error",
  [ErrorCode.MANIFEST_001]: "error",
  [ErrorCode.MANIFEST_002]: "error",
  [ErrorCode.INTEGRITY_001]: "error",
  [ErrorCode.INTEGRITY_002]: "error",
  [ErrorCode.CRYPTO_001]: "warning",
};

export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.PARENT_001]: "Component references non-existent parent_id",
  [ErrorCode.PARENT_002]: "parent_id must reference a layout component (category: layout)",
  [ErrorCode.CONTENTREF_001]: "Content reference points to non-existent page",
  [ErrorCode.CONTENTREF_002]: "Content reference uses invalid pointer syntax (must be <page>.json#/<key>)",
  [ErrorCode.CONTENTREF_003]: "Content reference key not found in target content file",
  [ErrorCode.I18N_002]: "Locale missing in content; will fallback to defaultLocale",
  [ErrorCode.COMP_001]: "Component type not found in DS catalog",
  [ErrorCode.COMP_002]: "Component props do not match DS catalog schema",
  [ErrorCode.A11Y_001]: "Image missing alt text",
  [ErrorCode.PRICE_001]: "Price missing amount, currency, or period",
  [ErrorCode.ICON_001]: "Icon not in whitelist and not a valid Unicode pictograph",
  [ErrorCode.ASSET_001]: "Referenced asset file does not exist",
  [ErrorCode.ASSET_002]: "Asset file exists but is not referenced anywhere",
  [ErrorCode.RICHTEXT_001]: "HTML tags detected in rich-text field",
  [ErrorCode.LINK_001]: "Internal link points to non-existent page",
  [ErrorCode.LINK_002]: "External link uses http: (must be https:)",
  [ErrorCode.LINK_003]: "Anchor link points to non-existent element ID",
  [ErrorCode.SEO_001]: "SEO title or description exceeds recommended length",
  [ErrorCode.SEO_002]: "SEO jsonLd missing required @context or @type",
  [ErrorCode.SECRET_001]: "Potential secret detected (API key, token, private key)",
  [ErrorCode.MANIFEST_001]: "Manifest references non-existent site.config.yaml",
  [ErrorCode.MANIFEST_002]: "Manifest bundleVersion does not match schema version",
  [ErrorCode.INTEGRITY_001]: "File integrity hash mismatch",
  [ErrorCode.INTEGRITY_002]: "Global integrity hash mismatch",
  [ErrorCode.CRYPTO_001]: "Weak cryptographic pattern detected (ambiguous context)",
};

export function createIssue(
  code: ErrorCode,
  file: string,
  message?: string,
  location?: { line?: number; column?: number }
): ValidationIssue {
  return {
    code,
    severity: ErrorSeverity[code],
    file,
    message: message || ErrorMessage[code],
    location,
  };
}

export function isErrorCode(code: string): code is ErrorCode {
  return code in ErrorSeverity;
}

export function groupBySeverity(issues: ValidationIssue[]): ValidationResult {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  return {
    errors,
    warnings,
    valid: errors.length === 0,
  };
}