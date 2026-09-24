import { promises as fs } from "node:fs";
import path from "node:path";
import type { ValidationIssue } from "./errors.js";
import { validateFileContent } from "./syntax-documents.js";

export async function validateSyntax(bundleDir: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const manifestPath = path.join(bundleDir, "manifest.yaml");
  const siteConfigPath = path.join(bundleDir, "site.config.yaml");

  try {
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    issues.push(...validateFileContent("manifest", manifestContent, "manifest.yaml"));
  } catch (e) {
    issues.push({
      code: "SYNTAX_ERROR",
      severity: "error",
      file: "manifest.yaml",
      message: e instanceof Error ? e.message : "Failed to parse manifest.yaml",
    });
  }

  try {
    const siteConfigContent = await fs.readFile(siteConfigPath, "utf-8");
    issues.push(...validateFileContent("siteConfig", siteConfigContent, "site.config.yaml"));
  } catch (e) {
    issues.push({
      code: "SYNTAX_ERROR",
      severity: "error",
      file: "site.config.yaml",
      message: e instanceof Error ? e.message : "Failed to parse site.config.yaml",
    });
  }

  const compositionDir = path.join(bundleDir, "composition");
  try {
    const entries = await fs.readdir(compositionDir);
    for (const entry of entries) {
      if (!entry.endsWith(".yaml") && !entry.endsWith(".yml")) continue;
      const filePath = path.join(compositionDir, entry);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        issues.push(...validateFileContent("composition", content, `composition/${entry}`));
      } catch (e) {
        issues.push({
          code: "SYNTAX_ERROR",
          severity: "error",
          file: `composition/${entry}`,
          message: e instanceof Error ? e.message : `Failed to parse ${entry}`,
        });
      }
    }
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      issues.push({
        code: "SYNTAX_ERROR",
        severity: "error",
        file: "composition/",
        message: e instanceof Error ? e.message : "Failed to read composition/ directory",
      });
    }
  }

  const contentDir = path.join(bundleDir, "content");
  try {
    const locales = await fs.readdir(contentDir);
    for (const locale of locales) {
      const localeDir = path.join(contentDir, locale);
      const stat = await fs.stat(localeDir);
      if (!stat.isDirectory()) continue;

      const contentFiles = await fs.readdir(localeDir);
      for (const file of contentFiles) {
        if (!file.endsWith(".json") && !file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
        const filePath = path.join(localeDir, file);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const relPath = path.relative(bundleDir, filePath);
          issues.push(...validateFileContent("content", content, relPath));
        } catch (e) {
          const relPath = path.relative(bundleDir, filePath);
          issues.push({
            code: "SYNTAX_ERROR",
            severity: "error",
            file: relPath,
            message: e instanceof Error ? e.message : `Failed to parse ${file}`,
          });
        }
      }
    }
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      issues.push({
        code: "SYNTAX_ERROR",
        severity: "error",
        file: "content/",
        message: e instanceof Error ? e.message : "Failed to read content/ directory",
      });
    }
  }

  const seoDir = path.join(contentDir, "seo");
  try {
    const seoLocales = await fs.readdir(seoDir);
    for (const locale of seoLocales) {
      const localeDir = path.join(seoDir, locale);
      const stat = await fs.stat(localeDir);
      if (!stat.isDirectory()) continue;

      const seoFiles = await fs.readdir(localeDir);
      for (const file of seoFiles) {
        if (!file.endsWith(".yaml") && !file.endsWith(".yml") && !file.endsWith(".json")) continue;
        const filePath = path.join(localeDir, file);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const relPath = path.relative(bundleDir, filePath);
          issues.push(...validateFileContent("seo", content, relPath));
        } catch (e) {
          const relPath = path.relative(bundleDir, filePath);
          issues.push({
            code: "SYNTAX_ERROR",
            severity: "error",
            file: relPath,
            message: e instanceof Error ? e.message : `Failed to parse ${file}`,
          });
        }
      }
    }
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      issues.push({
        code: "SYNTAX_ERROR",
        severity: "error",
        file: "content/seo/",
        message: e instanceof Error ? e.message : "Failed to read content/seo/ directory",
      });
    }
  }

  return issues;
}
