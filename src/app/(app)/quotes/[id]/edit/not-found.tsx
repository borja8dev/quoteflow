import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";

export default function EditQuoteNotFound() {
  return (
    <>
      <BackLink href="/quotes">Back to quotes</BackLink>
      <Card className="text-sm text-slate-700">
        <h1 className="text-lg font-semibold text-slate-900">Quote not found</h1>
        <p className="mt-2">
          This quote does not exist or you do not have access to it.
        </p>
      </Card>
    </>
  );
}
