import "./admin.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Editorial workspace",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="admin-area">{children}</div>;
}
