import type { HTMLAttributes } from "react";

import type { QuoteStatus } from "@/features/quotes/domain/status";

import { cn } from "./cn";

export type BadgeTone = "gray" | "blue" | "green" | "red";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const BASE_CLASSES =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";

const TONE_CLASSES: Record<BadgeTone, string> = {
  gray: "border-slate-200 bg-slate-100 text-slate-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

/**
 * Maps a quote status to the badge tone shared across list, detail and
 * dashboard surfaces (UI-10).
 */
export function statusBadgeTone(status: QuoteStatus): BadgeTone {
  switch (status) {
    case "draft":
      return "gray";
    case "sent":
      return "blue";
    case "accepted":
      return "green";
    case "rejected":
      return "red";
  }
}

export function Badge({
  tone = "gray",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={cn(BASE_CLASSES, TONE_CLASSES[tone], className)} {...rest}>
      {children}
    </span>
  );
}
