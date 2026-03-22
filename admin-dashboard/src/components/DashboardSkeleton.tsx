import { ui } from '../styles/ui';

// Loading placeholder for the admin dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="h-4 w-64 animate-pulse rounded-lg bg-(--panel-soft)" />
        <div className="h-9 w-40 animate-pulse rounded-xl bg-(--panel-soft)" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`${ui.panel} min-h-39 animate-pulse border-(--border-muted) bg-(--panel-soft) p-5 shadow-none`}>
            <div className="h-3 w-24 rounded bg-(--border-muted) opacity-60" />
            <div className="mt-4 h-9 w-20 rounded-lg bg-(--border-muted) opacity-40" />
            <div className="mt-6 h-12 rounded-lg bg-(--border-muted) opacity-30" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(420px,480px)]">
        <div className={`${ui.panel} h-96 animate-pulse bg-(--panel-soft) p-5`}>
          <div className="h-4 w-40 rounded bg-(--border-muted) opacity-50" />
          <div className="mt-6 h-70 rounded-xl bg-(--border-muted) opacity-25" />
        </div>
        <div className={`${ui.panel} h-96 animate-pulse bg-(--panel-soft) p-5`}>
          <div className="h-4 w-32 rounded bg-(--border-muted) opacity-50" />
          <div className="mt-8 mx-auto h-40 w-40 rounded-full bg-(--border-muted) opacity-30" />
        </div>
      </div>
    </div>
  );
}
