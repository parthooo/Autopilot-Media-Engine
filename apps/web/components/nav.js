"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    label: null,
    links: [{ href: "/", label: "Overview", match: (path) => path === "/" }],
  },
  {
    label: "Parent · Library",
    links: [
      { href: "/trends", label: "Trends", match: (path) => path.startsWith("/trends") },
      {
        href: "/opportunities",
        label: "Opportunities",
        match: (path) => path.startsWith("/opportunities"),
      },
      { href: "/ingestion", label: "Ingestion", match: (path) => path.startsWith("/ingestion") },
    ],
  },
  {
    label: "Children · Factory",
    links: [
      { href: "/content", label: "Content", match: (path) => path.startsWith("/content") },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-brand">
        Autopilot Media Engine
      </Link>
      <nav className="sidebar-nav" aria-label="Main">
        {navSections.map((section) => (
          <div key={section.label ?? "root"} className="sidebar-section">
            {section.label && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link${link.match(pathname) ? " is-active" : ""}`}
                aria-current={link.match(pathname) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <Link
          href="/guide"
          className={`sidebar-link sidebar-guide${pathname === "/guide" ? " is-active" : ""}`}
          aria-current={pathname === "/guide" ? "page" : undefined}
        >
          Guide
        </Link>
        <button
          type="button"
          className="btn sidebar-logout"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
