import { pageActor } from "@/lib/auth";
import { getPost } from "@/lib/cms";
import { ArticleBody } from "@/components/article";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await pageActor();
  const p = await getPost((await params).id);
  return (
    <article lang={p.working.locale}>
      <p className="alert">Private working draft preview · not published</p>
      <h1>{p.working.title}</h1>
      <p>{p.working.excerpt}</p>
      <ArticleBody content={p.working.content} />
    </article>
  );
}
