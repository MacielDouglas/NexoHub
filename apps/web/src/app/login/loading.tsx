import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-linear-to-br from-[#0c0c12] via-[#14141c] to-[#1a1410] p-6">
      <div className="absolute top-5 right-6">
        <Skeleton className="size-9 rounded-full" />
      </div>

      <div className="w-full max-w-md rounded-3xl bg-card p-8 ring-1 ring-white/10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Skeleton className="size-16 rounded-2xl" />
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-4 w-52 rounded-md" />
        </div>

        <Skeleton className="h-13 w-full rounded-full" />

        <div className="mt-4">
          <Skeleton className="h-13 w-full rounded-full" />
        </div>

        <div className="mt-6 flex justify-center">
          <Skeleton className="h-3 w-64 rounded-md" />
        </div>
      </div>
    </div>
  );
}
