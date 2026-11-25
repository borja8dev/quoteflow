import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function ClientsLoading() {
  return (
    <>
      <PageHeader title="Clients" description="Loading your clients…" />
      <ul className="flex flex-col gap-3" aria-busy="true">
        {[0, 1, 2].map((placeholder) => (
          <li key={placeholder}>
            <Card className="h-16 animate-pulse border-slate-200 bg-slate-100 p-0 shadow-none" />
          </li>
        ))}
      </ul>
    </>
  );
}
