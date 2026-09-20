import { pageActor } from "@/lib/auth";
import { MediaPanel } from "@/components/admin-panels";
export default async function Page() {
  const a = await pageActor();
  return (
    <>
      <h1>Media library</h1>
      <MediaPanel admin={a.role === "admin"} />
    </>
  );
}
