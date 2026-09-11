import { test, expect } from "@playwright/test";

const ROUTES = [
  { hash: "#/", expect: "Tokens del Design System" },
  { hash: "#/componentes", expect: "Componentes (18/18)" },
  { hash: "#/preview/home", expect: "Sonrisas que transforman vidas" },
] as const;

test.describe("showcase", () => {
  for (const route of ROUTES) {
    test(`ruta ${route.hash} carga contenido esperado sin errores`, async ({ page }) => {
      const errors: string[] = [];
      const failed: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("requestfailed", (r) => failed.push(r.url()));
      page.on("response", (r) => {
        if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
      });
      await page.goto(`/${route.hash}`);
      await expect(page.locator("#app")).toContainText(route.expect);
      expect(errors).toEqual([]);
      expect(failed).toEqual([]);
    });
  }

  test("toggle de tema recorre light/dark/auto con data-theme real", async ({ page }) => {
    await page.goto("/#/");
    const toggle = page.locator("#theme-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator("#theme-label")).toContainText("Tema: light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await toggle.click();
    await expect(page.locator("#theme-label")).toContainText("Tema: dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await toggle.click();
    await expect(page.locator("#theme-label")).toContainText("Tema: auto");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
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
      await page.waitForFunction((t) => document.documentElement.getAttribute("data-theme") === t, theme);
      await expect(page.locator("#visual-probes")).toHaveScreenshot(`probes-${theme}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    }
    const lightBg = await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      return getComputedStyle(document.documentElement).getPropertyValue("--bg-base").trim();
    });
    expect(lightBg).toContain("oklch(1 0 0)");
    const darkBg = await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      return getComputedStyle(document.documentElement).getPropertyValue("--bg-base").trim();
    });
    expect(darkBg).toContain("oklch(0.19 0.01 260)");
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
