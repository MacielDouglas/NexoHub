export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-muted" />
      </div>

      <div className="mb-8 flex gap-2 rounded-xl bg-muted p-1.5">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-background" />
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-background" />
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-background" />
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl bg-card p-6 ring-1 ring-white/10">
          <div className="mb-3 h-6 w-52 animate-pulse rounded bg-muted" />
          <div className="mb-6 h-4 w-72 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 ring-1 ring-white/10">
          <div className="mb-3 h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="mb-6 h-4 w-64 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
