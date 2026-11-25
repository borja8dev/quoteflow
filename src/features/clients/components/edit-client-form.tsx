"use client";

import { updateClientAction } from "@/features/clients/actions";

import {
  ClientForm,
  type ClientFormInitialValues,
} from "./client-form";

type EditClientFormProps = {
  clientId: string;
  initialValues: ClientFormInitialValues;
};

export function EditClientForm({
  clientId,
  initialValues,
}: EditClientFormProps) {
  const boundAction = updateClientAction.bind(null, clientId);

  return (
    <ClientForm
      action={boundAction}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      initialValues={initialValues}
    />
  );
}
