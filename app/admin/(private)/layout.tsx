import { pageActor } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const a = await pageActor();
  return (
    <AdminShell name={a.name} role={a.role}>
      {children}
    </AdminShell>
  );
}
