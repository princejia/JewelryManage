export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* 标题栏骨架 */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border bg-white p-5"
          >
            <div className="h-11 w-11 animate-pulse rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* 列表/表格骨架 */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b bg-gray-50/60 px-4 py-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
              <div className="hidden h-4 w-20 animate-pulse rounded bg-gray-200 sm:block" />
              <div className="hidden h-4 w-16 animate-pulse rounded bg-gray-200 sm:block" />
            </div>
          ))}
        </div>
      </div>

      {/* 加载提示 */}
      <div className="flex items-center justify-center gap-2 pt-2 text-sm text-gray-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        正在加载…
      </div>
    </div>
  );
}
