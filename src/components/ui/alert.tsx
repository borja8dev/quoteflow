import type { ReactNode } from "react";

import { cn } from "./cn";

export type AlertTone = "error" | "success";

type AlertProps = {
  tone: AlertTone;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

const BASE_CLASSES = "rounded-lg border p-4 text-sm";

const TONE_CLASSES: Record<AlertTone, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const TONE_ROLES: Record<AlertTone, "alert" | "status"> = {
  error: "alert",
  success: "status",
};

export function Alert({ tone, children, action, className }: AlertProps) {
  const role = TONE_ROLES[tone];
  const hasAction = Boolean(action);
  return (
    <section
      role={role}
      className={cn(
        BASE_CLASSES,
        TONE_CLASSES[tone],
        hasAction ? "flex flex-col items-start gap-3" : null,
        className,
      )}
    >
      {children}
      {hasAction ? action : null}
    </section>
  );
}
