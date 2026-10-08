"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FiGrid,
  FiFileText,
  FiFolder,
  FiTag,
  FiImage,
  FiSettings,
  FiKey,
  FiArrowUpRight,
  FiMenu,
  FiX,
  FiPlus,
  FiNavigation,
} from "react-icons/fi";
import { Logout } from "./admin-auth";
const navigation = [
  { href: "/admin", label: "Overview", icon: FiGrid },
  { href: "/admin/posts", label: "Posts", icon: FiFileText },
  { href: "/admin/categories", label: "Categories", icon: FiFolder },
  { href: "/admin/tags", label: "Tags", icon: FiTag },
  { href: "/admin/media", label: "Media library", icon: FiImage },
  { href: "/admin/api-keys", label: "API keys", icon: FiKey, admin: true },
  { href: "/admin/settings", label: "Settings", icon: FiSettings, admin: true },
];
export function AdminShell({
  name,
  role,
  children,
}: {
  name: string;
  role: "admin" | "editor";
  children: React.ReactNode;
}) {
  const path = usePathname(),
    [open, setOpen] = useState(false);
  const active = (href: string) =>
    href === "/admin" ? path === href : path.startsWith(href);
  const title = navigation.find((n) => active(n.href))?.label ?? "Workspace";
  return (
    <div className={`admin-shell${open ? " navigation-open" : ""}`}>
      <aside className="admin-sidebar" id="admin-navigation">
        <Link className="admin-brand" href="/admin">
          <span className="admin-brand-icon">
            <FiNavigation aria-hidden />
          </span>
          <span>
            Dhaka Bus Routes<small>ADMIN WORKSPACE</small>
          </span>
        </Link>
        <p className="admin-nav-label">Workspace</p>
        <nav aria-label="Editorial">
          {navigation
            .filter((n) => !n.admin || role === "admin")
            .map((n) => (
              <Link
                href={n.href}
                key={n.href}
                aria-current={active(n.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <n.icon aria-hidden />
                <span>{n.label}</span>
              </Link>
            ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/" className="admin-view-site">
            View website <FiArrowUpRight aria-hidden />
          </Link>
          <div className="admin-account">
            <span className="admin-avatar" aria-hidden>
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{name}</strong>
              <small>{role === "admin" ? "Administrator" : "Editor"}</small>
            </span>
          </div>
          <Logout />
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="row">
            <button
              type="button"
              className="admin-menu-button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="admin-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <FiX /> : <FiMenu />}
            </button>
            <span>
              Workspace <span className="admin-breadcrumb-separator">/</span>{" "}
              <strong>{title}</strong>
            </span>
          </div>
          <Link className="button admin-new-post" href="/admin/posts/new">
            <FiPlus aria-hidden /> New post
          </Link>
        </header>
        <div className="admin-content" id="admin-content">
          {children}
        </div>
        <footer className="admin-workspace-footer">
          Dhaka Bus Routes <span>Editorial workspace</span>
        </footer>
      </div>
    </div>
  );
}
