import { pageActor } from "@/lib/auth";
import { TaxonomyPanel } from "@/components/admin-panels";
export default async function Page() {
  const a = await pageActor();
  return <TaxonomyPanel kind="categories" admin={a.role === "admin"} />;
}
