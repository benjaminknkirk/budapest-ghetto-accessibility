"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Map" },
  { href: "/method", label: "Method" },
  { href: "/paper", label: "Paper" },
  { href: "/briefing", label: "CAGR briefing" },
  { href: "/one-pager", label: "One-pager" },
  { href: "/teach", label: "Teach" },
  { href: "/outreach", label: "Outreach" },
  { href: "/data", label: "Data" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="site-header">
      <Link href="/" className="mark">
        <span className="star" aria-hidden>
          ✦
        </span>
        <span>
          <strong>Mapping Access Under Occupation</strong>
          <em>Budapest ghetto, 1944–45</em>
        </span>
      </Link>
      <nav>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
        <a href="/mapping-access-under-occupation.pdf" download className="pdf-link">
          PDF
        </a>
      </nav>
    </header>
  );
}
