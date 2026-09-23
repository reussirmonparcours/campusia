export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-label="Chargement du tableau de bord">
      {/* 1. Header Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-24 rounded-full bg-slate-200 animate-pulse motion-reduce:animate-none" />
              <div className="h-4 w-20 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="h-8 w-48 sm:w-64 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="h-10 w-32 rounded-lg bg-slate-200 animate-pulse motion-reduce:animate-none" />
        </div>

        {/* Academic Card Skeleton */}
        <div className="rounded-xl border border-border-default bg-surface-muted/60 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                <div className="h-4 w-28 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Hero Skeleton */}
      <div className="rounded-xl border border-border-default bg-surface-base p-5 sm:p-6 shadow-subtle">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 max-w-xl">
            <div className="h-5 w-36 rounded-full bg-slate-200 animate-pulse motion-reduce:animate-none" />
            <div className="h-6 w-56 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-80 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="h-11 w-full sm:w-40 rounded-lg bg-slate-200 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>

      {/* 3. Metrics Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-44 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`rounded-xl border border-border-default bg-surface-base p-4 shadow-subtle space-y-2 ${
                i === 4 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                <div className="h-4 w-4 rounded-full bg-slate-200 animate-pulse motion-reduce:animate-none" />
              </div>
              <div className="h-7 w-12 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-20 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Quick Actions Skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-base p-3.5 sm:p-4 shadow-subtle min-h-[56px]"
            >
              <div className="h-10 w-10 rounded-lg bg-slate-200 shrink-0 animate-pulse motion-reduce:animate-none" />
              <div className="space-y-1 flex-1">
                <div className="h-4 w-20 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-16 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Objectives & Activity Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border-default bg-surface-base p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-12 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5 py-2">
                <div className="h-4 w-48 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-28 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-surface-base p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-16 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className="h-8 w-8 rounded-lg bg-slate-200 shrink-0 animate-pulse motion-reduce:animate-none" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-full rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                  <div className="h-3 w-24 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
