import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: ReactNode;
  labelSuffix?: ReactNode;
  error?: string;
  hint?: ReactNode;
};

const FIELD_CLASSES =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0";

export function Input({
  id,
  label,
  labelSuffix,
  error,
  hint,
  className,
  "aria-describedby": ariaDescribedBy,
  ...rest
}: InputProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy =
    [ariaDescribedBy, errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
        {labelSuffix ? (
          <span className="ml-1 font-normal text-slate-500">{labelSuffix}</span>
        ) : null}
      </label>
      <input
        id={id}
        className={cn(FIELD_CLASSES, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
