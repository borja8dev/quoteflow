"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

type QuotesErrorProps = {
  reset: () => void;
};

export default function QuotesError({ reset }: QuotesErrorProps) {
  return (
    <>
      <PageHeader title="Quotes" />
      <Alert
        tone="error"
        action={
          <Button type="button" onClick={reset} variant="secondary" size="sm">
            Try again
          </Button>
        }
      >
        <p>We could not load your quotes.</p>
      </Alert>
    </>
  );
}
