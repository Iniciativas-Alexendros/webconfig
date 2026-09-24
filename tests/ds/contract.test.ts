import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import AjvModule from "ajv/dist/2020.js";

type AjvClass = new (opts: object) => {
  compile: (schema: object) => ((data: unknown) => boolean) & { errors?: unknown };
};
const Ajv2020 = (AjvModule as unknown as { default: AjvClass }).default;

const TOKENS_DIR = resolve("tokens");
const schema = JSON.parse(readFileSync(join(TOKENS_DIR, "contract.schema.json"), "utf-8")) as object;
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = ajv.compile(schema);

describe("contrato de tokens v1.0", () => {
  const files = readdirSync(TOKENS_DIR)
    .filter((file) => file.endsWith(".tokens.json"))
    .sort();

  it("las cinco hojas cumplen el esquema", () => {
    for (const file of files) {
      const json = JSON.parse(readFileSync(join(TOKENS_DIR, file), "utf-8")) as { $meta?: { ds?: string } };
      const ok = validate(json);
      expect(ok, `${file} ${JSON.stringify(validate.errors)}`).toBe(true);
      expect(json.$meta?.ds).toBe("webconfig");
    }
  });

  it("rechaza una hoja sin $meta", () => {
    expect(validate({ color: { brand: { "500": { $value: "oklch(0.5 0.1 262)", $type: "color" } } } })).toBe(false);
  });

  it("exige colorSpace oklch en la hoja de color primitivo", () => {
    const color = JSON.parse(readFileSync(join(TOKENS_DIR, "primitive.color.tokens.json"), "utf-8")) as {
      $meta: { colorSpace?: string };
    };
    delete color.$meta.colorSpace;
    expect(validate(color)).toBe(false);
  });

  it("rechaza un color primitivo que no es oklch ni referencia", () => {
    expect(
      validate({
        $meta: { ds: "webconfig", tier: "primitive", version: "1.0", colorSpace: "oklch" },
        color: { brand: { "500": { $value: "#3366ff", $type: "color" } } },
      })
    ).toBe(false);
  });
});
