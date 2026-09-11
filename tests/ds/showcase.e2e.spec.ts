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

  test("visual: sondas de color solido light y dark", async ({ page }) => {
    await page.goto("/#/");
    await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.id = "visual-probes";
      probe.setAttribute("style", "display:flex;gap:8px;padding:16px;background:#808080;");
      for (const v of [
        "--action-primary-bg",
        "--bg-base",
        "--text-base",
        "--border-base",
        "--badge-success-bg",
        "--badge-danger-bg",
      ]) {
        const d = document.createElement("div");
        d.setAttribute("style", `width:80px;height:48px;background:var(${v});border:1px solid #000;`);
        d.dataset.var = v;
        probe.appendChild(d);
      }
      document.getElementById("app")?.prepend(probe);
    });
    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await page.waitForTimeout(200);
      await expect(page.locator("#visual-probes")).toHaveScreenshot(`probes-${theme}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    }
    const lightBg = await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      return getComputedStyle(document.documentElement).getPropertyValue("--bg-base").trim();
    });
    const darkBg = await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      return getComputedStyle(document.documentElement).getPropertyValue("--bg-base").trim();
    });
    expect(lightBg).not.toBe("");
    expect(darkBg).not.toBe("");
    expect(darkBg).not.toBe(lightBg);
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
