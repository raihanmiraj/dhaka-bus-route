import { contentSchema, headingId, plain, type Content } from "@/lib/content";
import { createElement } from "react";
function Inline({ text }: { text: string }) {
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
}
function List({
  items,
  ordered,
  start = 1,
}: {
  items: { content: string; items: { content: string; items: unknown[] }[] }[];
  ordered: boolean;
  start?: number;
}) {
  return createElement(
    ordered ? "ol" : "ul",
    ordered ? { start } : null,
    items.map((item, i) => (
      <li key={i}>
        <Inline text={item.content} />
        {item.items.length > 0 && (
          <List ordered={ordered} items={item.items as typeof items} />
        )}
      </li>
    )),
  );
}
export function ArticleBody({ content }: { content: Content }) {
  const safe = contentSchema.parse(content);
  return (
    <div className="prose">
      {safe.blocks.map((b, i) => {
        switch (b.type) {
          case "paragraph":
            return (
              <p key={i}>
                <Inline text={b.data.text} />
              </p>
            );
          case "header":
            return createElement(
              `h${b.data.level}`,
              { id: headingId(i, b.id), key: i },
              <Inline text={b.data.text} />,
            );
          case "list":
            return (
              <List
                key={i}
                items={b.data.items}
                start={
                  typeof b.data.meta?.start === "number" &&
                  b.data.meta.start > 0
                    ? b.data.meta.start
                    : 1
                }
                ordered={b.data.style === "ordered"}
              />
            );
          case "quote":
            return (
              <blockquote key={i}>
                <p>
                  <Inline text={b.data.text} />
                </p>
                <cite>
                  <Inline text={b.data.caption} />
                </cite>
              </blockquote>
            );
          case "image":
            return (
              <figure key={i}>
                {/* Native image: GridFS endpoint enforces access; no optimization cache for draft media. */}
                <img
                  src={b.data.file.url}
                  alt={b.data.alt}
                  width={b.data.file.width}
                  height={b.data.file.height}
                  loading="lazy"
                />
                <figcaption>
                  <Inline text={b.data.caption} />
                </figcaption>
              </figure>
            );
          case "table":
            return (
              <div className="table-scroll" key={i}>
                <table>
                  {b.data.withHeadings && (
                    <thead>
                      <tr>
                        {b.data.content[0].map((c, j) => (
                          <th scope="col" key={j}>
                            <Inline text={c} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {b.data.content
                      .slice(b.data.withHeadings ? 1 : 0)
                      .map((r, j) => (
                        <tr key={j}>
                          {r.map((c, k) => (
                            <td key={k}>
                              <Inline text={c} />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            );
          case "delimiter":
            return <hr key={i} />;
        }
      })}
    </div>
  );
}
export function TableOfContents({ content }: { content: Content }) {
  const headings = contentSchema
    .parse(content)
    .blocks.flatMap((b, i) =>
      b.type === "header"
        ? [{ text: plain(b.data.text), id: headingId(i, b.id) }]
        : [],
    );
  return headings.length ? (
    <nav className="toc" aria-label="In this article">
      <strong>In this article</strong>
      {headings.map((h) => (
        <a href={`#${h.id}`} key={h.id}>
          {h.text}
        </a>
      ))}
    </nav>
  ) : null;
}
