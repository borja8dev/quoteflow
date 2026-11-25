"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

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
        <label htmlFor="clientId" className="text-sm font-medium text-gray-900">
          Client
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          defaultValue={initialValues?.clientId ?? ""}
          aria-invalid={clientError ? true : undefined}
          aria-describedby={clientError ? "clientId-error" : undefined}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
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
          <h2 className="text-base font-semibold text-gray-900">Line items</h2>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
          >
            Add item
          </button>
        </div>

        <ul className="flex flex-col gap-4">
          {items.map((item, index) => {
            const errors = itemErrorsFor(state, index);
            const descriptionId = `${item.key}-description`;
            const quantityId = `${item.key}-quantity`;
            const unitPriceId = `${item.key}-unitPrice`;

            return (
              <li
                key={item.key}
                className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Item {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    aria-label={`Remove item ${index + 1}`}
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={descriptionId}
                    className="text-sm font-medium text-gray-900"
                  >
                    Description
                  </label>
                  <input
                    id={descriptionId}
                    name={`items[${index}].description`}
                    type="text"
                    required
                    value={item.description}
                    onChange={(event) =>
                      updateItem(index, "description", event.target.value)
                    }
                    aria-invalid={errors?.description ? true : undefined}
                    aria-describedby={
                      errors?.description ? `${descriptionId}-error` : undefined
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                  {errors?.description ? (
                    <p
                      id={`${descriptionId}-error`}
                      className="text-sm text-red-600"
                    >
                      {errors.description}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={quantityId}
                      className="text-sm font-medium text-gray-900"
                    >
                      Quantity
                    </label>
                    <input
                      id={quantityId}
                      name={`items[${index}].quantity`}
                      type="text"
                      inputMode="decimal"
                      required
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, "quantity", event.target.value)
                      }
                      aria-invalid={errors?.quantity ? true : undefined}
                      aria-describedby={
                        errors?.quantity ? `${quantityId}-error` : undefined
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    {errors?.quantity ? (
                      <p
                        id={`${quantityId}-error`}
                        className="text-sm text-red-600"
                      >
                        {errors.quantity}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={unitPriceId}
                      className="text-sm font-medium text-gray-900"
                    >
                      Unit price (€)
                    </label>
                    <input
                      id={unitPriceId}
                      name={`items[${index}].unitPrice`}
                      type="text"
                      inputMode="decimal"
                      required
                      value={item.unitPrice}
                      onChange={(event) =>
                        updateItem(index, "unitPrice", event.target.value)
                      }
                      aria-invalid={errors?.unitPrice ? true : undefined}
                      aria-describedby={
                        errors?.unitPrice ? `${unitPriceId}-error` : undefined
                      }
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    {errors?.unitPrice ? (
                      <p
                        id={`${unitPriceId}-error`}
                        className="text-sm text-red-600"
                      >
                        {errors.unitPrice}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-label="Quote totals"
        className="flex flex-col gap-1 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">
            {formatCentsAsEuros(totals.subtotalCents)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">VAT (21%)</span>
          <span className="font-medium text-gray-900">
            {formatCentsAsEuros(totals.vatCents)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-gray-200 pt-2">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-base font-semibold text-gray-900">
            {formatCentsAsEuros(totals.totalCents)}
          </span>
        </div>
      </section>

      {generalError ? (
        <p role="alert" className="text-sm text-red-600">
          {generalError}
        </p>
      ) : null}

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending || clients.length === 0}
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
