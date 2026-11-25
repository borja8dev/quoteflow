import type { HTMLAttributes } from "react";

import { cn } from "./cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

const BASE_CLASSES =
  "rounded-lg border border-slate-200 bg-white p-4 shadow-sm";

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={cn(BASE_CLASSES, className)} {...rest}>
      {children}
    </div>
  );
}
