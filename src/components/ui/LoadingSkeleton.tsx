export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
              <div className="ml-5 flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b border-gray-200 pb-4">
                  <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 w-full bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-full bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-6 w-48 bg-gray-200 rounded"></div>
                <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j}>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ml-4">
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
