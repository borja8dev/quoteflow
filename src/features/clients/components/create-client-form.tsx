"use client";

import { createClientAction } from "@/features/clients/actions";

import { ClientForm } from "./client-form";

export function CreateClientForm() {
  return (
    <ClientForm
      action={createClientAction}
      submitLabel="Create client"
      pendingLabel="Creating…"
    />
  );
}
