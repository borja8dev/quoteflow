import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { AppNav } from "./_components/app-nav";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center justify-between gap-4 sm:justify-start">
            <Link
              href="/"
              className="rounded-md text-base font-semibold tracking-tight text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              QuoteFlow
            </Link>
            <div className="flex items-center gap-3 sm:hidden">
              {user?.email ? (
                <span
                  className="max-w-[10rem] truncate text-xs text-slate-600"
                  aria-label="Signed in as"
                >
                  {user.email}
                </span>
              ) : null}
              <LogoutButton />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-1 sm:justify-end sm:gap-4">
            <AppNav />
            <div className="hidden items-center gap-3 sm:flex">
              {user?.email ? (
                <span
                  className="max-w-[14rem] truncate text-sm text-slate-600"
                  aria-label="Signed in as"
                >
                  {user.email}
                </span>
              ) : null}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
