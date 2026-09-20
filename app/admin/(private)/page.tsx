import { pageActor } from "@/lib/auth";
import { Corrections } from "@/components/admin-panels";
export default async function Page() {
  const a = await pageActor();
  return (
    <>
      <h1>Editorial overview</h1>
      <p>
        Create drafts, review sources, and publish only when the article is
        ready.
      </p>
      <a className="button" href="/admin/posts/new">
        Write an article
      </a>
      {a.role === "admin" && <Corrections />}
    </>
  );
}
