import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const blankDraft = (slug: string) => ({
  slug,
  locale: "en",
  translationGroup: null,
  contentSchemaVersion: 1,
  sources: [],
  seoTitle: "",
  socialImageId: null,
  indexable: true,
  routeLinks: [],
});
test("Editor.js persistence, publication isolation, media security and redirects", async ({
  page,
  browser,
}) => {
  test.setTimeout(120000);
  const credentials = JSON.parse(
    await readFile("/private/tmp/dhaka-browser-fixture.json", "utf8"),
  );
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Editorial overview" }),
  ).toBeVisible();
  const origin = "http://localhost:3018";
  const mutate = async (path: string, data: unknown) => {
    const r = await page.request.post(`/api/admin/${path}`, {
      headers: { origin },
      data,
    });
    expect(r.ok(), await r.text()).toBe(true);
    return r.json();
  };
  const nonce = Date.now();
  const terms = [];
  for (let i = 0; i < 2; i++) {
    const term = {
      name: `Category ${i} ${nonce}`,
      slug: `category-${i}-${nonce}`,
      description:
        "An editorially curated test introduction with useful context for readers of these source-referenced articles.",
      seoTitle: "Test category",
      seoDescription: "Useful introduction",
      locale: "en",
      indexable: true,
    };
    terms.push((await mutate("categories", term)).insertedId);
  }
  const tag = (
    await mutate("tags", {
      name: "Test tag",
      slug: `tag-${nonce}`,
      description: "",
      seoTitle: "",
      seoDescription: "",
      locale: "en",
      indexable: false,
    })
  ).insertedId;
  const raw = await readFile(
    "public/images/dhaka-bus-route-icon-transparent-blue-header-64.png",
  );
  const upload = await page.request.post("/api/upload", {
    headers: { origin },
    multipart: {
      image: { name: "fixture.png", mimeType: "image/png", buffer: raw },
    },
  });
  expect(upload.ok(), await upload.text()).toBe(true);
  const file = (await upload.json()).file;
  const anonymous = await browser.newContext();
  expect((await anonymous.request.get(`${origin}${file.url}`)).status()).toBe(
    401,
  );
  const malicious = await page.request.post("/api/upload", {
    headers: { origin },
    multipart: {
      image: {
        name: "evil.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg onload="alert(1)"></svg>'),
      },
    },
  });
  expect(malicious.status()).toBe(415);
  let post = await mutate("posts", {});
  const working = {
    ...blankDraft(`cms-${nonce}`),
    title: "Browser fixture article",
    excerpt: "An isolated test article, not production content.",
    seoTitle: "Fixture SEO title",
    seoDescription: "A complete test description",
    categoryIds: terms,
    primaryCategoryId: terms[0],
    tagIds: [tag],
    featuredImage: {
      mediaId: file.mediaId,
      alt: "Test logo",
      caption: "Fixture",
    },
    content: {
      blocks: [
        {
          type: "paragraph",
          data: {
            text: 'Public paragraph <b>bold</b> with <a href="/routes">routes</a>.',
          },
        },
        { type: "header", data: { text: "Second-level heading", level: 2 } },
        { type: "header", data: { text: "Third-level heading", level: 3 } },
        { type: "header", data: { text: "Fourth-level heading", level: 4 } },
        {
          type: "list",
          data: {
            style: "ordered",
            meta: { start: 1, counterType: "numeric" },
            items: [
              {
                content: "Parent",
                meta: {},
                items: [{ content: "Child", meta: {}, items: [] }],
              },
            ],
          },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: [{ content: "Bullet", items: [] }],
          },
        },
        {
          type: "quote",
          data: {
            text: "A test quotation",
            caption: "Fixture caption",
            alignment: "left",
          },
        },
        {
          type: "image",
          data: {
            file,
            alt: "Inline test image",
            caption: "Inline caption",
            withBorder: false,
            stretched: false,
            withBackground: false,
          },
        },
        {
          type: "table",
          data: {
            withHeadings: true,
            content: [
              ["Heading A", "Heading B"],
              ["Cell A", "Cell B"],
            ],
          },
        },
        { type: "delimiter", data: {} },
      ],
    },
  };
  post = await mutate(`posts/${post._id}/save`, {
    version: post.version,
    working,
  });
  await page.goto(`/admin/posts/${post._id}/edit`);
  await expect(
    page.locator(".ce-paragraph").filter({ hasText: "Public paragraph" }),
  ).toBeVisible();
  await expect(page.getByLabel("Image alternative text")).toHaveValue(
    "Inline test image",
  );
  await page.getByLabel("Article title").fill("Browser fixture edited");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("status", { exact: false }).filter({ hasText: "Saved" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Article title")).toHaveValue(
    "Browser fixture edited",
  );
  await expect(
    page.locator(".ce-paragraph").filter({ hasText: "Public paragraph" }),
  ).toBeVisible();
  post = await (await page.request.get(`/api/admin/posts/${post._id}`)).json();
  expect(post.working.content.blocks).toHaveLength(10);
  expect(post.working.categoryIds).toHaveLength(2);
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `/private/tmp/dhaka-admin-${width}.png`,
        fullPage: true,
      });
  }
  const correction = await anonymous.request.post(`${origin}/api/corrections`, {
    headers: { origin },
    data: {
      routeId: 1,
      message: "Test correction awaiting editorial verification",
      source: "Isolated test observation",
      website: "",
    },
  });
  expect(correction.status()).toBe(201);
  const reports = await (
    await page.request.get("/api/admin/corrections")
  ).json();
  expect(
    reports.some(
      (r: { message: string }) =>
        r.message === "Test correction awaiting editorial verification",
    ),
  ).toBe(true);
  await mutate(`corrections/${reports[0]._id}`, {
    status: "reviewed",
    note: "Test review; no public data change",
  });

  for (const path of [
    "/blog",
    "/feed.xml",
    "/sitemap.xml",
    `/blog/category/category-0-${nonce}`,
  ]) {
    expect(
      await (await anonymous.request.get(origin + path)).text(),
    ).not.toContain("Browser fixture edited");
  }
  expect(
    (await anonymous.request.get(`${origin}/blog/${working.slug}`)).status(),
  ).toBe(404);
  post = await mutate(`posts/${post._id}/publish`, { version: post.version });
  const article = await anonymous.request.get(`${origin}/blog/${working.slug}`);
  const html = await article.text();
  expect(article.status()).toBe(200);
  expect(html).toContain("Browser fixture edited");
  expect(html).toContain("BlogPosting");
  expect(html).toContain("Public paragraph");
  expect(html).toContain("canonical");
  expect(html).toContain("Inline test image");
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(`${origin}/blog/${working.slug}`);
  await expect(staticPage.getByRole("heading", { level: 1 })).toHaveText(
    "Browser fixture edited",
  );
  await expect(
    staticPage.getByRole("cell", { name: "Cell A", exact: true }),
  ).toBeVisible();
  await expect(staticPage.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${origin}/blog/${working.slug}`,
  );
  for (const width of [360, 390, 768, 1024, 1440]) {
    await staticPage.setViewportSize({ width, height: 900 });
    expect(
      await staticPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await noJs.close();

  expect((await anonymous.request.get(origin + file.url)).ok()).toBe(true);
  expect(
    await (await anonymous.request.get(origin + "/sitemap.xml")).text(),
  ).toContain(working.slug);
  post = await mutate(`posts/${post._id}/save`, {
    version: post.version,
    working: { ...post.working, title: "SECRET WORKING DRAFT" },
  });
  for (const path of [
    `/blog/${working.slug}`,
    "/blog",
    "/feed.xml",
    "/sitemap.xml",
  ])
    expect(
      await (await anonymous.request.get(origin + path)).text(),
    ).not.toContain("SECRET WORKING DRAFT");
  const conflict = await page.request.post(
    `/api/admin/posts/${post._id}/save`,
    {
      headers: { origin },
      data: { version: post.version - 1, working: post.working },
    },
  );
  expect(conflict.status()).toBe(409);
  const foreign = await page.request.post(
    `/api/admin/posts/${post._id}/publish`,
    {
      headers: { origin: "https://evil.invalid" },
      data: { version: post.version },
    },
  );
  expect(foreign.status()).toBe(403);
  post = await mutate(`posts/${post._id}/publish`, { version: post.version });
  expect(
    await (
      await anonymous.request.get(`${origin}/blog/${working.slug}`)
    ).text(),
  ).toContain("SECRET WORKING DRAFT");
  post = await mutate(`posts/${post._id}/save`, {
    version: post.version,
    working: { ...post.working, slug: `changed-${nonce}` },
  });
  post = await mutate(`posts/${post._id}/publish`, { version: post.version });
  const redirect = await anonymous.request.get(
    `${origin}/blog/${working.slug}`,
    { maxRedirects: 0 },
  );
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe(`/blog/changed-${nonce}`);
  post = await mutate(`posts/${post._id}/unpublish`, { version: post.version });
  expect(
    (await anonymous.request.get(`${origin}/blog/changed-${nonce}`)).status(),
  ).toBe(404);
  expect((await anonymous.request.get(origin + file.url)).status()).toBe(401);
  await anonymous.close();
});
