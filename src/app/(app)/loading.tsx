import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function DashboardLoading() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Loading your dashboard…"
      />
      <section
        aria-busy="true"
        aria-label="Quote summary"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {[0, 1, 2, 3].map((placeholder) => (
          <Card
            key={placeholder}
            className="h-24 animate-pulse border-slate-200 bg-slate-100 p-0 shadow-none"
          />
        ))}
      </section>
      <Card className="h-24 animate-pulse border-slate-200 bg-slate-100 p-0 shadow-none" />
    </>
  );
}
