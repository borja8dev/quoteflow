"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCentsAsEuros } from "@/features/quotes/domain/format";
import {
  QuoteTotalsError,
  computeQuoteTotals,
} from "@/features/quotes/domain/money";

import type { QuoteActionResult, QuoteFieldErrors } from "../actions";

export type QuoteFormClientOption = {
  id: string;
  name: string;
};

export type QuoteFormItemInitialValue = {
  description: string;
  quantity: string;
  unitPrice: string;
};

export type QuoteFormInitialValues = {
  clientId: string;
  items: ReadonlyArray<QuoteFormItemInitialValue>;
};

type QuoteFormAction = (
  previousState: QuoteActionResult | null,
  formData: FormData,
) => Promise<QuoteActionResult>;

type QuoteFormProps = {
  action: QuoteFormAction;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
  clients: ReadonlyArray<QuoteFormClientOption>;
  initialValues?: QuoteFormInitialValues;
};

type ItemRow = QuoteFormItemInitialValue & { key: string };

function createEmptyRow(key: number): ItemRow {
  return {
    key: `item-${key}`,
    description: "",
    quantity: "1",
    unitPrice: "0",
  };
}

function parseQuantityForPreview(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized.length === 0 || !/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseEurosForPreview(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized.length === 0 || !/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100);
}

function itemErrorsFor(
  state: QuoteActionResult | null,
  index: number,
): QuoteFieldErrors["items"] extends infer T
  ? T extends Record<number, infer V>
    ? V | undefined
    : undefined
  : undefined {
  if (!state || state.ok || !state.fieldErrors?.items) {
    return undefined;
  }
  return state.fieldErrors.items[index];
}

const SELECT_CLASSES =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function QuoteForm({
  action,
  submitLabel,
  pendingLabel,
  cancelHref,
  clients,
  initialValues,
}: QuoteFormProps) {
  const [state, formAction, isPending] = useActionState<
    QuoteActionResult | null,
    FormData
  >(action, null);

  const [items, setItems] = useState<ItemRow[]>(() => {
    const seed = initialValues?.items ?? [];
    if (seed.length === 0) {
      return [createEmptyRow(0)];
    }
    return seed.map((item, index) => ({
      key: `item-${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
  });

  const clientError = state && !state.ok ? state.fieldErrors?.clientId : undefined;
  const generalError =
    state && !state.ok && !state.fieldErrors ? state.error : undefined;

  const totals = useMemo(() => {
    const lines = items.map((item) => ({
      quantity: parseQuantityForPreview(item.quantity),
      unitPriceCents: parseEurosForPreview(item.unitPrice),
    }));
    const usable = lines.filter(
      (line): line is { quantity: number; unitPriceCents: number } =>
        line.quantity !== null && line.unitPriceCents !== null,
    );
    try {
      return computeQuoteTotals(usable);
    } catch (error) {
      if (error instanceof QuoteTotalsError) {
        return {
          lines: [],
          subtotalCents: 0,
          vatCents: 0,
          totalCents: 0,
        };
      }
      throw error;
    }
  }, [items]);

  function updateItem(
    index: number,
    field: "description" | "quantity" | "unitPrice",
    value: string,
  ) {
    setItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      createEmptyRow(current.length === 0 ? 0 : current.length),
    ]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-6" noValidate>
      <input type="hidden" name="itemCount" value={items.length} />

      <div className="flex flex-col gap-1">
        <label htmlFor="clientId" className="text-sm font-medium text-slate-900">
          Client
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          defaultValue={initialValues?.clientId ?? ""}
          aria-invalid={clientError ? true : undefined}
          aria-describedby={clientError ? "clientId-error" : undefined}
          className={SELECT_CLASSES}
        >
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        {clientError ? (
          <p id="clientId-error" className="text-sm text-red-600">
            {clientError}
          </p>
        ) : null}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Line items</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addItem}
          >
            Add item
          </Button>
        </div>

        <ul className="flex flex-col gap-4">
          {items.map((item, index) => {
            const errors = itemErrorsFor(state, index);
            const descriptionId = `${item.key}-description`;
            const quantityId = `${item.key}-quantity`;
            const unitPriceId = `${item.key}-unitPrice`;

            return (
              <li key={item.key}>
                <Card className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">
                      Item {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      aria-label={`Remove item ${index + 1}`}
                    >
                      Remove
                    </Button>
                  </div>

                  <Input
                    id={descriptionId}
                    name={`items[${index}].description`}
                    type="text"
                    required
                    value={item.description}
                    onChange={(event) =>
                      updateItem(index, "description", event.target.value)
                    }
                    label="Description"
                    error={errors?.description}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      id={quantityId}
                      name={`items[${index}].quantity`}
                      type="text"
                      inputMode="decimal"
                      required
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, "quantity", event.target.value)
                      }
                      label="Quantity"
                      error={errors?.quantity}
                    />

                    <Input
                      id={unitPriceId}
                      name={`items[${index}].unitPrice`}
                      type="text"
                      inputMode="decimal"
                      required
                      value={item.unitPrice}
                      onChange={(event) =>
                        updateItem(index, "unitPrice", event.target.value)
                      }
                      label="Unit price (€)"
                      error={errors?.unitPrice}
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <Card
        aria-label="Quote totals"
        className="flex flex-col gap-1 bg-slate-50 text-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium tabular-nums text-slate-900">
            {formatCentsAsEuros(totals.subtotalCents)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">VAT (21%)</span>
          <span className="font-medium tabular-nums text-slate-900">
            {formatCentsAsEuros(totals.vatCents)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="text-base font-semibold tabular-nums text-slate-900">
            {formatCentsAsEuros(totals.totalCents)}
          </span>
        </div>
      </Card>

      {generalError ? (
        <p role="alert" className="text-sm text-red-600">
          {generalError}
        </p>
      ) : null}

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          disabled={isPending || clients.length === 0}
        >
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
