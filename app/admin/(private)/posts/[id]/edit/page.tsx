import { pageActor } from "@/lib/auth";
import { getPost } from "@/lib/cms";
import { PostEditor } from "@/components/post-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const a = await pageActor();
  const p = await getPost((await params).id);
  return <PostEditor role={a.role} initial={JSON.parse(JSON.stringify(p))} />;
}
