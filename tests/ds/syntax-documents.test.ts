import { describe, it, expect } from "vitest";
import { exampleBundleMap } from "../../showcase/src/lib/example-bundle.js";
import { bundleMapFromRelativePaths } from "../../showcase/src/lib/bundle-files.js";
import { ValidateView } from "../../showcase/src/views/validate.js";
import {
  messageFromUnknown,
  validateFileContent,
  validateSyntaxDocuments,
} from "../../src/validate/syntax-documents.js";

function files(extra: Record<string, string> = {}): Map<string, string> {
  return new Map([...exampleBundleMap(), ...Object.entries(extra)]);
}

describe("validación de esquema en memoria", () => {
  it("el ejemplo local no tiene errores", () => {
    expect(validateSyntaxDocuments(exampleBundleMap())).toEqual([]);
  });

  it("informa ficheros obligatorios ausentes", () => {
    const issues = validateSyntaxDocuments(new Map());
    expect(issues.map((issue) => issue.file)).toEqual(["manifest.yaml", "site.config.yaml"]);
    expect(issues.every((issue) => issue.code === "SYNTAX_ERROR")).toBe(true);
  });

  it("MANIFEST_001 si falta un campo requerido y SYNTAX_PATTERN si el patrón no cuadra", () => {
    const broken = files();
    broken.set("manifest.yaml", "name: solo-nombre\n");
    const required = validateSyntaxDocuments(broken);
    expect(required.some((issue) => issue.code === "MANIFEST_001")).toBe(true);

    const pattern = files();
    const manifest = pattern.get("manifest.yaml")?.replace("bundleVersion: 1.0.0", "bundleVersion: 9.9.9");
    pattern.set("manifest.yaml", manifest ?? "");
    expect(validateSyntaxDocuments(pattern).some((issue) => issue.code === "SYNTAX_PATTERN")).toBe(true);
  });

  it("rechaza YAML inválido, JSON de contenido inválido y composición sin page", () => {
    const yaml = files();
    yaml.set("composition/home.yaml", ": :");
    expect(validateSyntaxDocuments(yaml).some((issue) => issue.file === "composition/home.yaml")).toBe(true);

    const json = files();
    json.set("content/es/home.json", "{");
    expect(validateFileContent("content", "{", "content/es/home.json")[0]?.code).toBe("SYNTAX_ERROR");

    const page = files();
    page.set("composition/home.yaml", "components:\n  - id: a\n    props: {}\n    type: hero\n");
    expect(validateSyntaxDocuments(page).some((issue) => issue.file === "composition/home.yaml")).toBe(true);
  });

  it("valida contenido yaml, seo yml y ignora binarios al normalizar rutas", () => {
    const map = files();
    map.set("content/es/nota.yaml", "blocks:\n  - id: nota\n    type: text-block\n    values:\n      content: Hola\n");
    map.set("content/seo/es/home.yml", map.get("content/seo/es/home.yaml") ?? "");
    map.delete("content/seo/es/home.yaml");
    expect(validateSyntaxDocuments(map)).toEqual([]);

    const fromFolder = bundleMapFromRelativePaths([
      { path: "ejemplo-local/manifest.yaml", text: "m" },
      { path: "ejemplo-local/assets/logo.png", text: "bin" },
      { path: "ejemplo-local\\composition\\home.yaml", text: "c" },
    ]);
    expect([...fromFolder.keys()].sort()).toEqual(["composition/home.yaml", "manifest.yaml"]);
  });

  it("messageFromUnknown cubre error y valor desconocido", () => {
    expect(messageFromUnknown(new Error("roto"), "a.yaml")).toBe("roto");
    expect(messageFromUnknown("x", "a.yaml")).toBe("Failed to parse a.yaml");
  });

  it("la vista muestra el ejemplo válido y un error", () => {
    const ok = ValidateView({ sourceLabel: "ejemplo local", issues: [] });
    expect(ok).toContain("ejemplo local");
    expect(ok).toContain("Esquema válido");
    expect(ok).toContain("sin servidor");
    const bad = ValidateView({
      sourceLabel: "archivos locales",
      issues: [{ code: "SYNTAX_ERROR", severity: "error", file: "manifest.yaml", message: "Missing manifest.yaml" }],
    });
    expect(bad).toContain("SYNTAX_ERROR");
    expect(bad).toContain("1 error");
  });
});
