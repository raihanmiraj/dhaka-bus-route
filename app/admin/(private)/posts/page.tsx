import { pageActor } from "@/lib/auth";
import { PostList } from "@/components/post-list";
export default async function Page() {
  await pageActor();
  return <PostList />;
}
