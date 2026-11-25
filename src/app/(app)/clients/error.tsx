"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

type ClientsErrorProps = {
  reset: () => void;
};

export default function ClientsError({ reset }: ClientsErrorProps) {
  return (
    <>
      <PageHeader title="Clients" />
      <Alert
        tone="error"
        action={
          <Button type="button" onClick={reset} variant="secondary" size="sm">
            Try again
          </Button>
        }
      >
        <p>We could not load your clients.</p>
      </Alert>
    </>
  );
}
