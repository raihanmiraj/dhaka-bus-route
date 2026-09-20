import React from "react";
import { it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ArticleBody, TableOfContents } from "../components/article";
import { contentSchema } from "../lib/content";
it("renders semantic safe HTML, nested lists and matching anchors without hydration", () => {
  const content = contentSchema.parse({
    blocks: [
      { type: "header", data: { level: 2, text: "A heading" } },
      {
        type: "paragraph",
        data: { text: "Text <b>bold</b><script>alert(1)</script>" },
      },
      {
        type: "list",
        data: {
          style: "unordered",
          items: [
            { content: "Parent", items: [{ content: "Child", items: [] }] },
          ],
        },
      },
      {
        type: "table",
        data: { withHeadings: true, content: [["Header"], ["Cell"]] },
      },
    ],
  });
  const html = renderToStaticMarkup(
    <>
      <TableOfContents content={content} />
      <ArticleBody content={content} />
    </>,
  );
  expect(html).toContain('href="#heading-1"');
  expect(html).toContain('id="heading-1"');
  expect(html).toContain('<th scope="col">');
  expect(html).toContain("Child");
  expect(html).not.toContain("script");
});
