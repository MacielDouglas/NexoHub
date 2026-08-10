import { Skeleton } from "@/components/ui/skeleton";

export default function WelcomeLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6">
      <Skeleton className="size-16 rounded-2xl" />
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-4 w-72 rounded-md" />
      <Skeleton className="mt-4 h-12 w-full max-w-sm rounded-full" />
    </div>
  );
}
