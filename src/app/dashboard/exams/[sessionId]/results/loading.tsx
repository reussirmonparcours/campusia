export default function ExamResultsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-48 bg-surface-muted rounded-md" />

      {/* Hero Skeleton */}
      <div className="rounded-2xl border border-border-default bg-surface-base p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-muted" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-surface-muted rounded-full" />
            <div className="h-7 w-64 bg-surface-muted rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
          <div className="md:col-span-5 h-40 bg-surface-muted rounded-xl" />
          <div className="md:col-span-7 h-40 bg-surface-muted rounded-xl" />
        </div>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border-default bg-surface-base p-4 space-y-3">
            <div className="h-3 w-20 bg-surface-muted rounded" />
            <div className="h-8 w-16 bg-surface-muted rounded" />
          </div>
        ))}
      </div>

      {/* Revision CTA Skeleton */}
      <div className="h-32 rounded-2xl border border-border-default bg-surface-muted" />

      {/* Questions List Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="h-6 w-48 bg-surface-muted rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border-default bg-surface-base" />
        ))}
      </div>
    </div>
  );
}
