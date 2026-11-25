"use client";

import { useActionState } from "react";

import {
  changeQuoteStatusAction,
  type QuoteActionResult,
} from "@/features/quotes/actions";
import type { QuoteStatus } from "@/features/quotes/domain/status";

type StatusTransitionButtonsProps = {
  quoteId: string;
  currentStatus: QuoteStatus;
  lineItemCount: number;
};

type TransitionOption = {
  label: string;
  pendingLabel: string;
  nextStatus: QuoteStatus;
  tone: "primary" | "success" | "danger" | "neutral";
};

const CLASSES_BY_TONE: Record<TransitionOption["tone"], string> = {
  primary:
    "bg-gray-900 text-white border-transparent hover:bg-gray-800 disabled:opacity-60",
  success:
    "bg-emerald-600 text-white border-transparent hover:bg-emerald-700 disabled:opacity-60",
  danger:
    "border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-60",
  neutral:
    "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-60",
};

function optionsFor(status: QuoteStatus): ReadonlyArray<TransitionOption> {
  if (status === "draft") {
    return [
      {
        label: "Send",
        pendingLabel: "Sending…",
        nextStatus: "sent",
        tone: "primary",
      },
    ];
  }
  if (status === "sent") {
    return [
      {
        label: "Mark accepted",
        pendingLabel: "Saving…",
        nextStatus: "accepted",
        tone: "success",
      },
      {
        label: "Mark rejected",
        pendingLabel: "Saving…",
        nextStatus: "rejected",
        tone: "danger",
      },
      {
        label: "Return to draft",
        pendingLabel: "Saving…",
        nextStatus: "draft",
        tone: "neutral",
      },
    ];
  }
  return [];
}

type TransitionButtonProps = {
  quoteId: string;
  option: TransitionOption;
  disabled: boolean;
  disabledReason?: string;
};

function TransitionButton({
  quoteId,
  option,
  disabled,
  disabledReason,
}: TransitionButtonProps) {
  const boundAction = changeQuoteStatusAction.bind(null, quoteId);
  const [state, formAction, isPending] = useActionState<
    QuoteActionResult | null,
    FormData
  >(boundAction, null);

  const errorMessage = state && !state.ok ? state.error : undefined;

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="nextStatus" value={option.nextStatus} />
      <button
        type="submit"
        disabled={disabled || isPending}
        title={disabled ? disabledReason : undefined}
        className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed ${CLASSES_BY_TONE[option.tone]}`}
      >
        {isPending ? option.pendingLabel : option.label}
      </button>
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

export function StatusTransitionButtons({
  quoteId,
  currentStatus,
  lineItemCount,
}: StatusTransitionButtonsProps) {
  const options = optionsFor(currentStatus);
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      {options.map((option) => {
        const needsItemsToSend =
          currentStatus === "draft" &&
          option.nextStatus === "sent" &&
          lineItemCount === 0;
        return (
          <TransitionButton
            key={option.nextStatus}
            quoteId={quoteId}
            option={option}
            disabled={needsItemsToSend}
            disabledReason={
              needsItemsToSend
                ? "Add at least one line item before sending."
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
