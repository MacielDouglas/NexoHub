export default function PeopleLoading() {
  return (
    <div className="space-y-5 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-card p-5 ring-1 ring-white/10 sm:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-12 w-32 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {(["a", "b", "c", "d", "e"] as const).map((k) => (
              <div
                key={`stat-${k}`}
                className="h-20 animate-pulse rounded-xl bg-muted/60 ring-1 ring-white/5"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="h-10 max-w-md animate-pulse rounded-full bg-muted" />

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-px flex-1 bg-white/10" />
        </div>
        {(["a", "b", "c"] as const).map((k) => (
          <div
            key={`row-${k}`}
            className="flex h-16 items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-white/10"
          >
            <div className="size-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
