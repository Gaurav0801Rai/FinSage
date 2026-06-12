export function PageSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-6 max-w-[1400px] mx-auto animate-pulse">
      <div className="space-y-2">
        <div className="skeleton h-7 w-40 rounded-lg" />
        <div className="skeleton h-4 w-56 rounded-md" />
      </div>
      <div className="skeleton h-[180px] rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-[110px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-[280px] rounded-2xl" />
        <div className="skeleton h-[280px] rounded-2xl" />
      </div>
      <div className="skeleton h-[360px] rounded-2xl" />
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-2xl" />
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="skeleton h-12 rounded-none border-b border-glass-border" />
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="px-5 py-4 border-b border-glass-border
                     last:border-b-0 flex items-center gap-4"
        >
          <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-3 w-36 rounded" />
          </div>
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}