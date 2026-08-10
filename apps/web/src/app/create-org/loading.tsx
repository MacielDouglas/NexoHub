import { Skeleton } from "@/components/ui/skeleton";

export default function CreateOrgLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 ring-1 ring-white/10">
        <Skeleton className="mb-6 h-8 w-48 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
        <Skeleton className="mt-6 h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
