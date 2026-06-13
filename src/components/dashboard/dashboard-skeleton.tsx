export function DashboardSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-6 max-w-[1400px] mx-auto">
      {/* Title */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-32 rounded-lg" />
        <div className="skeleton h-4 w-48 rounded-md" />
      </div>

      {/* Hero */}
      <div className="skeleton h-[180px] rounded-[12px]" />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-[110px] rounded-[12px]" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-[280px] rounded-[12px]" />
        <div className="skeleton h-[280px] rounded-[12px]" />
      </div>

      {/* Table */}
      <div className="skeleton h-[360px] rounded-[12px]" />
    </div>
  );
}