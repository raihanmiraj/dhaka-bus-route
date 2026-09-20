import { pageActor } from "@/lib/auth";
import { Logout } from "@/components/admin-auth";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const a = await pageActor();
  return (
    <div className="admin-shell">
      <aside>
        <p className="eyebrow">Editorial workspace</p>
        <p>
          {a.name} · {a.role}
        </p>
        <nav aria-label="Editorial">
          {[
            ["", "Overview"],
            ["/posts", "Posts"],
            ["/categories", "Categories"],
            ["/tags", "Tags"],
            ["/media", "Media"],
            ...(a.role === "admin" ? [["/settings", "Settings"]] : []),
          ].map(([h, t]) => (
            <a key={h} href={`/admin${h}`}>
              {t}
            </a>
          ))}
        </nav>
        <Logout />
      </aside>
      <div>{children}</div>
    </div>
  );
}
