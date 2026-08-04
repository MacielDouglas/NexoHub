export default function PeopleLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-muted" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(["a", "b", "c", "d", "e", "f"] as const).map((k) => (
          <div
            key={`stat-${k}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6"
          >
            <div className="h-11 w-11 animate-pulse rounded-3xl bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
      </div>

      <div className="space-y-3">
        {(["a", "b", "c", "d"] as const).map((k) => (
          <div
            key={`row-${k}`}
            className="h-20 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
