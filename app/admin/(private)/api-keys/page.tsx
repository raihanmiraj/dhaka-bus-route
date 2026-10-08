import { pageActor } from "@/lib/auth";
import { ApiKeysPanel } from "@/components/api-keys-panel";
export default async function Page() {
  await pageActor(true);
  return <ApiKeysPanel />;
}
