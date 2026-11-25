import Link from "next/link";
import type { ReactNode } from "react";

type BackLinkProps = {
  href: string;
  children: ReactNode;
};

const LINK_CLASSES =
  "rounded-md text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50";

export function BackLink({ href, children }: BackLinkProps) {
  return (
    <nav className="text-sm">
      <Link href={href} className={LINK_CLASSES}>
        &larr; {children}
      </Link>
    </nav>
  );
}
