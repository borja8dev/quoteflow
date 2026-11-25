import { BackLink } from "@/components/ui/back-link";
import { Card } from "@/components/ui/card";

export default function EditClientNotFound() {
  return (
    <>
      <BackLink href="/clients">Back to clients</BackLink>
      <Card className="text-sm text-slate-700">
        <h1 className="text-lg font-semibold text-slate-900">
          Client not found
        </h1>
        <p className="mt-2">
          This client does not exist or you do not have access to it.
        </p>
      </Card>
    </>
  );
}
