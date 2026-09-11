import { test, expect } from "@playwright/test";

const ROUTES = ["#/", "#/componentes", "#/preview/home"] as const;

test.describe("showcase", () => {
  for (const route of ROUTES) {
    test(`ruta ${route} carga sin errores`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(`/${route}`);
      await expect(page.locator("#app")).not.toBeEmpty();
      expect(errors).toEqual([]);
    });
  }

  test("toggle de tema light/dark/auto", async ({ page }) => {
    await page.goto("/#/");
    const toggle = page.locator("#theme-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator("#theme-label")).toContainText("Tema:");
    await toggle.click();
    await toggle.click();
  });

  test("componentes muestra 18 tarjetas", async ({ page }) => {
    await page.goto("/#/componentes");
    await expect(page.locator("[data-component]")).toHaveCount(18);
  });

  test("preview renderiza golden home", async ({ page }) => {
    await page.goto("/#/preview/home");
    await expect(page.locator("#app")).toContainText("Sonrisas");
  });

  test("visual: screenshots light y dark", async ({ page }) => {
    for (const theme of ["light", "dark"] as const) {
      await page.goto("/#/");
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await page.waitForTimeout(200);
      await expect(page.locator("table.tokens")).toHaveScreenshot(`tokens-table-${theme}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    }
    await page.goto("/#/componentes");
    await expect(page.locator("[data-component='hero']").first()).toHaveScreenshot("component-hero.png", {
      maxDiffPixelRatio: 0.02,
    });
    await page.goto("/#/preview/home");
    await expect(page.locator(".hero").first()).toHaveScreenshot("preview-hero.png", { maxDiffPixelRatio: 0.02 });
  });

  test("a11y basico: landmarks, lang y foco visible", async ({ page }) => {
    await page.goto("/#/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("nav[aria-label] >> nth=0")).toBeVisible();
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus-visible");
    await expect(focused.first()).toBeVisible();
  });
});
