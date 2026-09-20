import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [360, 390, 768, 1024, 1440])
  test(`route finder at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.screenshot({
      path: `/private/tmp/dhaka-home-${width}.png`,
      fullPage: true,
    });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Find your bus across Dhaka.",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const from = page.getByRole("combobox", { name: "Boarding stop" });
    await from.fill("মিরপুর ১০");
    await expect(page.getByRole("option").first()).toHaveText("Mirpur 10");
    await from.press("ArrowDown");
    await from.press("Enter");
    await page
      .getByRole("combobox", { name: "Destination stop" })
      .fill("Farmgate");
    await page.getByRole("button", { name: "Find buses" }).click();
    await expect(page.getByRole("status")).toContainText("matches");
    await page.getByRole("button", { name: "Swap stops" }).click();
    await expect(page.locator("section.card h3")).toHaveCount(0);
  });
test("homepage accessibility and legacy API", async ({ page, request }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  const r = await request.get("/api/bus-route");
  expect(r.ok()).toBe(true);
  const data = await r.json();
  expect(data).toHaveLength(184);
  expect(data[0]).toHaveProperty("routeStops");
  expect(r.headers()["access-control-allow-origin"]).toBe("*");
  const invalid = await request.get("/buses/not-a-route");
  expect(invalid.status()).toBe(404);
});
test("private mutations reject unauthenticated requests", async ({
  request,
}) => {
  const r = await request.post("/api/admin/posts", { data: {} });
  expect(r.status()).toBe(401);
  const preview = await request.get("/admin/preview/aaaaaaaaaaaaaaaaaaaaaaaa", {
    maxRedirects: 0,
  });
  expect(preview.status()).toBe(307);
});

test("invalid journeys, pagination and robots are honest", async ({
  request,
}) => {
  const bad = await request.get("/api/search?from=Mirpur&to=Farmgate");
  expect(bad.status()).toBe(400);
  expect(
    (await request.get("/api/search?from=mirpur-10&to=mirpur-10")).status(),
  ).toBe(400);
  expect((await request.get("/blog?page=999")).status()).toBe(404);
  expect(
    (await request.get("/blog?page=1", { maxRedirects: 0 })).status(),
  ).toBe(307);
  expect((await request.get("/blog/tag/no-such-tag")).status()).toBe(404);
  expect((await request.get("/bn/blog/no-translation")).status()).toBe(404);
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "/sitemap.xml",
  );
  expect(await (await request.get("/admin/login")).text()).toContain("noindex");
});

test("public scripts exclude Editor.js and record local performance", async ({
  page,
}) => {
  const loaded = new Set<string>();
  page.on("response", (r) => {
    if (r.url().includes("/_next/static/") && r.url().endsWith(".js"))
      loaded.add(r.url());
  });
  await page.goto("/");
  await page.getByRole("combobox", { name: "Boarding stop" }).fill("Farmgate");
  await expect(page.getByRole("option").first()).toHaveText("Farmgate");
  for (const url of loaded) {
    const text = await (await page.request.get(url)).text();
    expect(text).not.toMatch(
      /codex-editor__redactor|class EditorJS|Editor\.js is ready/,
    );
  }
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];
    return {
      ttfbMs: Math.round(nav.responseStart - nav.requestStart),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
      scriptTransferBytes: resources
        .filter((r) => r.initiatorType === "script")
        .reduce((sum, r) => sum + r.transferSize, 0),
    };
  });
  console.log(
    "LOCAL_PERFORMANCE",
    JSON.stringify({ ...metrics, loadedNextScripts: loaded.size }),
  );
});
