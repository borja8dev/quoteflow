"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/components/ui/cn";

type NavLink = {
  href: string;
  label: string;
};

const LINKS: ReadonlyArray<NavLink> = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/quotes", label: "Quotes" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const BASE_LINK_CLASSES =
  "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const ACTIVE_CLASSES = "bg-indigo-50 text-indigo-700";
const INACTIVE_CLASSES = "text-slate-700 hover:bg-slate-100";

export function AppNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              BASE_LINK_CLASSES,
              active ? ACTIVE_CLASSES : INACTIVE_CLASSES,
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
