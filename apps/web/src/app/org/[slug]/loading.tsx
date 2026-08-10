import { Skeleton } from "@/components/ui/skeleton";

export default function OverviewLoading() {
  return (
    <div className="space-y-5 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl md:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>

      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}
