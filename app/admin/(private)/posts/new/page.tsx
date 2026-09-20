import { pageActor } from "@/lib/auth";
import { PostEditor } from "@/components/post-editor";
export default async function Page() {
  const a = await pageActor();
  return <PostEditor role={a.role} />;
}
