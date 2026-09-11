import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { contrastRatio, apcaLc } from "../../showcase/src/lib/contrast.js";

let fallback: { light: Record<string, string>; dark: Record<string, string> };

beforeAll(() => {
  execFileSync("node", ["scripts/build-tokens.mjs"], { stdio: "ignore", timeout: 30000 });
  fallback = JSON.parse(readFileSync(resolve("dist-tokens/json/fallback-hex.json"), "utf-8")) as {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
});

const PAIRS: Array<{ name: string; fg: string; bg: string; min: number; apca: number }> = [
  { name: "text/base sobre bg/base", fg: "--text-base", bg: "--bg-base", min: 4.5, apca: 60 },
  { name: "text/muted sobre bg/base", fg: "--text-muted", bg: "--bg-base", min: 4.5, apca: 45 },
  { name: "text/link sobre bg/base", fg: "--text-link", bg: "--bg-base", min: 4.5, apca: 45 },
  { name: "text/base sobre bg/surface", fg: "--text-base", bg: "--bg-surface", min: 4.5, apca: 60 },
  { name: "text/muted sobre bg/surface", fg: "--text-muted", bg: "--bg-surface", min: 4.5, apca: 45 },
  { name: "text/base sobre bg/muted", fg: "--text-base", bg: "--bg-muted", min: 4.5, apca: 45 },
  { name: "text/base sobre card/bg", fg: "--text-base", bg: "--card-bg", min: 4.5, apca: 60 },
  { name: "text/base sobre input/bg", fg: "--text-base", bg: "--input-bg", min: 4.5, apca: 60 },
  { name: "on-primary sobre primary-bg", fg: "--action-on-primary", bg: "--action-primary-bg", min: 4.5, apca: 60 },
  {
    name: "on-primary sobre primary-bg-hover",
    fg: "--action-on-primary",
    bg: "--action-primary-bg-hover",
    min: 4.5,
    apca: 60,
  },
  {
    name: "on-secondary sobre secondary-bg",
    fg: "--action-on-secondary",
    bg: "--action-secondary-bg",
    min: 4.5,
    apca: 45,
  },
  {
    name: "success-text sobre success-bg",
    fg: "--feedback-success-text",
    bg: "--feedback-success-bg",
    min: 4.5,
    apca: 45,
  },
  {
    name: "danger-text sobre danger-bg",
    fg: "--feedback-danger-text",
    bg: "--feedback-danger-bg",
    min: 4.5,
    apca: 45,
  },
  { name: "border/base sobre bg/base", fg: "--border-base", bg: "--bg-base", min: 3.0, apca: 1 },
  { name: "border/strong sobre bg/base", fg: "--border-strong", bg: "--bg-base", min: 3.0, apca: 1 },
];

describe("contraste WCAG AA + APCA", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const pair of PAIRS) {
      it(`${mode}: ${pair.name} cumple AA`, () => {
        const fg = fallback[mode][pair.fg] as string;
        const bg = fallback[mode][pair.bg] as string;
        expect(fg, `sin hex ${pair.fg} en ${mode}`).toBeTruthy();
        expect(bg, `sin hex ${pair.bg} en ${mode}`).toBeTruthy();
        expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(pair.min);
        if (pair.apca > 0) expect(Math.abs(apcaLc(fg, bg))).toBeGreaterThanOrEqual(pair.apca);
      });
    }
  }

  it("parámetros conocidos del fixture golden", () => {
    expect(contrastRatio("#ffffff", "#1d4ed8")).toBeGreaterThanOrEqual(4.5);
  });
});
