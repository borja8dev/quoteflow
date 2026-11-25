"use client";

import { useActionState } from "react";

import { Button, type ButtonVariant } from "@/components/ui/button";
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
  variant: ButtonVariant;
};

function optionsFor(status: QuoteStatus): ReadonlyArray<TransitionOption> {
  if (status === "draft") {
    return [
      {
        label: "Send",
        pendingLabel: "Sending…",
        nextStatus: "sent",
        variant: "primary",
      },
    ];
  }
  if (status === "sent") {
    return [
      {
        label: "Mark accepted",
        pendingLabel: "Saving…",
        nextStatus: "accepted",
        variant: "primary",
      },
      {
        label: "Mark rejected",
        pendingLabel: "Saving…",
        nextStatus: "rejected",
        variant: "destructive",
      },
      {
        label: "Return to draft",
        pendingLabel: "Saving…",
        nextStatus: "draft",
        variant: "secondary",
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
      <Button
        type="submit"
        variant={option.variant}
        size="sm"
        disabled={disabled || isPending}
        title={disabled ? disabledReason : undefined}
      >
        {isPending ? option.pendingLabel : option.label}
      </Button>
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
