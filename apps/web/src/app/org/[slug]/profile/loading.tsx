import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-5 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-white/10 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(["a", "b"] as const).map((k) => (
          <Skeleton key={k} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
