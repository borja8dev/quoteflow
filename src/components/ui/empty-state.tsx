import type { ReactNode } from "react";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <p className="text-base font-medium text-slate-900">{title}</p>
      {description ? (
        <p className="text-sm text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </section>
  );
}
