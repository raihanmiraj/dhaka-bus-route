import { pageActor } from "@/lib/auth";
import { SettingsPanel } from "@/components/admin-panels";
export default async function Page() {
  await pageActor(true);
  return <SettingsPanel />;
}
