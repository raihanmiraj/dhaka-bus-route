"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBookOpen,
  FiInfo,
  FiMap,
  FiNavigation,
  FiSearch,
} from "react-icons/fi";

const items = [
  { href: "/buses", label: "Buses", icon: FiNavigation },
  { href: "/routes", label: "Routes", icon: FiMap },
  { href: "/#search", label: "Search", icon: FiSearch, center: true },
  { href: "/blog", label: "Blog", icon: FiBookOpen },
  { href: "/about", label: "About", icon: FiInfo },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="mobile-nav" aria-label="App">
      {items.map((item) => {
        const active =
          item.href === "/#search"
            ? pathname === "/"
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;
        if ("center" in item && item.center) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-center${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label="Search routes"
            >
              <span className="mobile-nav-center-btn">
                <Icon aria-hidden size={22} />
              </span>
              <span>Search</span>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "is-active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <Icon aria-hidden size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
