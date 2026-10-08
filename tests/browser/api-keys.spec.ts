import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
test("dashboard login, responsive navigation and Bearer publishing lifecycle", async ({
  page,
  playwright,
}) => {
  test.setTimeout(120000);
  const credentials = JSON.parse(
    await readFile("/private/tmp/dhaka-browser-fixture.json", "utf8"),
  );
  await page.goto("/admin/login");
  await expect(
    page.getByRole("heading", { name: "Sign in to your workspace" }),
  ).toBeVisible();
  await expect(page.locator(".site-header")).not.toBeVisible();
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Hide password" }).click();
  await page.getByLabel("Email", { exact: true }).fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Editorial overview" }),
  ).toBeVisible();
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "/tmp/dhaka-admin-dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Editorial" })
    .getByRole("link", { name: "API keys", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "API keys", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page.getByLabel("Key name").fill("Local publishing test");
  await page.getByRole("button", { name: "Create API key" }).click();
  await expect(page.getByLabel("New API key", { exact: true })).toBeVisible();
  const token = await page
    .getByLabel("New API key", { exact: true })
    .inputValue();
  expect(token).toMatch(/^dbr_[a-f0-9]{24}_[A-Za-z0-9_-]{43}$/);
  await page.getByRole("button", { name: "I have saved it" }).click();
  await expect(page.getByLabel("New API key", { exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "/tmp/dhaka-admin-api-keys-desktop.png",
    fullPage: true,
  });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  const origin = "http://localhost:3018";
  const api = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  const anonymous = await playwright.request.newContext({ baseURL: origin });
  for (const path of [
    "posts",
    "categories",
    "tags",
    "media",
    "corrections",
    "settings",
    "links",
    "api-keys",
  ]) {
    const r = await api.get(`/api/admin/${path}`);
    expect(r.ok(), path + ": " + (await r.text())).toBe(true);
  }
  const keys = await (await api.get("/api/admin/api-keys")).json();
  expect(JSON.stringify(keys)).not.toContain(token);
  expect(JSON.stringify(keys)).not.toContain("tokenHash");
  const keyId = keys.find(
    (k: { name: string }) => k.name === "Local publishing test",
  )._id;
  const category = await api.post("/api/admin/categories", {
    data: {
      name: "API fixture",
      slug: `api-fixture-${Date.now()}`,
      description: "",
      seoTitle: "",
      seoDescription: "",
      locale: "en",
      indexable: false,
    },
  });
  expect(category.ok(), await category.text()).toBe(true);
  const categoryId = (await category.json()).insertedId;
  const image = await readFile(
    "public/images/dhaka-bus-route-icon-transparent-blue-header-64.png",
  );
  const upload = await api.post("/api/upload", {
    multipart: {
      image: { name: "fixture.png", mimeType: "image/png", buffer: image },
    },
  });
  expect(upload.ok(), await upload.text()).toBe(true);
  const file = (await upload.json()).file;
  expect((await anonymous.get(file.url)).status()).toBe(401);
  expect((await api.get(file.url)).ok()).toBe(true);
  expect(
    (
      await api.patch(`/api/admin/media/${file.mediaId}`, {
        data: { alt: "API fixture logo", caption: "Local test only" },
      })
    ).ok(),
  ).toBe(true);
  let post = await (await api.post("/api/admin/posts", { data: {} })).json();
  const working = {
    ...post.working,
    title: "API publishing fixture",
    slug: `api-publishing-${Date.now()}`,
    excerpt: "Local isolated fixture",
    seoDescription: "Local isolated fixture description",
    categoryIds: [categoryId],
    primaryCategoryId: categoryId,
    featuredImage: {
      mediaId: file.mediaId,
      alt: "API logo",
      caption: "Local test only",
    },
    content: {
      blocks: [
        {
          type: "paragraph",
          data: { text: "Published with a Bearer API key." },
        },
      ],
    },
  };
  const saved = await api.post(`/api/admin/posts/${post._id}/save`, {
    data: { version: post.version, working },
  });
  expect(saved.ok(), await saved.text()).toBe(true);
  post = await saved.json();
  const published = await api.post(`/api/admin/posts/${post._id}/publish`, {
    data: { version: post.version },
  });
  expect(published.ok(), await published.text()).toBe(true);
  post = await published.json();
  expect(post.status).toBe("published");
  expect((await anonymous.get(`/blog/${working.slug}`)).status()).toBe(200);
  const bad = await anonymous.post("/api/admin/posts", {
    headers: { Authorization: "Bearer invalid" },
    data: {},
  });
  expect(bad.status()).toBe(401);
  const foreignCookie = await page.request.post("/api/admin/posts", {
    headers: { Origin: "https://evil.invalid" },
    data: {},
  });
  expect(foreignCookie.status()).toBe(403);
  expect((await api.delete(`/api/admin/api-keys/${keyId}`)).ok()).toBe(true);
  expect((await api.get("/api/admin/posts")).status()).toBe(401);
  await page.reload();
  await expect(
    page.getByRole("cell", { name: "Revoked", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to your workspace" }),
  ).toBeVisible();
  await api.dispose();
  await anonymous.dispose();
});
