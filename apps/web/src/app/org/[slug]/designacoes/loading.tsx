import { Skeleton } from "@/components/ui/skeleton";

export default function DesignacoesLoading() {
  return (
    <div className="space-y-5 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
      </div>

      <div className="flex w-fit max-w-full gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm">
        {(["a", "b"] as const).map((k) => (
          <Skeleton key={k} className="h-9 w-28 rounded-xl" />
        ))}
      </div>

      <div className="space-y-4">
        {(["a", "b", "c"] as const).map((k) => (
          <Skeleton key={k} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
