/**
 * Skeleton Loader Components for Better UX
 * Shows loading placeholders while content is being fetched
 */

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 animate-pulse">
      <div className="skeleton-dark w-24 h-24 rounded-full mx-auto mb-4"></div>
      <div className="skeleton-dark h-6 w-3/4 mx-auto mb-2 rounded"></div>
      <div className="skeleton-dark h-4 w-1/2 mx-auto mb-4 rounded"></div>
      <div className="space-y-2 mb-4">
        <div className="skeleton-dark h-3 w-full rounded"></div>
        <div className="skeleton-dark h-3 w-full rounded"></div>
        <div className="skeleton-dark h-3 w-2/3 rounded"></div>
      </div>
      <div className="skeleton-dark h-10 w-full rounded-lg"></div>
    </div>
  );
}

// Message Skeleton
export function MessageSkeleton() {
  return (
    <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="skeleton-dark h-5 w-1/3 rounded"></div>
        <div className="skeleton-dark h-4 w-20 rounded"></div>
      </div>
      <div className="skeleton-dark h-4 w-1/4 mb-2 rounded"></div>
      <div className="space-y-2">
        <div className="skeleton-dark h-3 w-full rounded"></div>
        <div className="skeleton-dark h-3 w-full rounded"></div>
        <div className="skeleton-dark h-3 w-3/4 rounded"></div>
      </div>
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="skeleton-dark h-4 w-full rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="skeleton-dark h-4 w-full rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="skeleton-dark h-4 w-full rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="skeleton-dark h-4 w-full rounded"></div>
      </td>
    </tr>
  );
}

// Property Card Skeleton
export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      <div className="skeleton h-48 w-full"></div>
      <div className="p-6">
        <div className="skeleton h-6 w-3/4 mb-2 rounded"></div>
        <div className="skeleton h-4 w-1/2 mb-4 rounded"></div>
        <div className="space-y-2 mb-4">
          <div className="skeleton h-3 w-full rounded"></div>
          <div className="skeleton h-3 w-full rounded"></div>
          <div className="skeleton h-3 w-2/3 rounded"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-1/3 rounded"></div>
          <div className="skeleton h-10 w-1/3 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Stats Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 animate-pulse">
      <div className="skeleton-dark h-4 w-1/2 mb-2 rounded"></div>
      <div className="skeleton-dark h-8 w-3/4 mb-2 rounded"></div>
      <div className="skeleton-dark h-3 w-1/3 rounded"></div>
    </div>
  );
}

// Agent Card Skeleton
export function AgentCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 animate-pulse">
      <div className="text-center mb-4">
        <div className="skeleton-dark w-24 h-24 rounded-full mx-auto mb-4"></div>
        <div className="skeleton-dark h-6 w-3/4 mx-auto mb-1 rounded"></div>
        <div className="skeleton-dark h-4 w-1/2 mx-auto mb-2 rounded"></div>
        <div className="skeleton-dark h-4 w-2/3 mx-auto rounded"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="skeleton-dark h-3 w-full rounded"></div>
        <div className="skeleton-dark h-3 w-full rounded"></div>
        <div className="skeleton-dark h-3 w-full rounded"></div>
      </div>
      <div className="skeleton-dark h-10 w-full rounded-lg"></div>
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="skeleton-dark w-12 h-12 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton-dark h-4 w-3/4 rounded"></div>
              <div className="skeleton-dark h-3 w-1/2 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton-dark h-4 w-1/4 mb-2 rounded"></div>
          <div className="skeleton-dark h-12 w-full rounded-lg"></div>
        </div>
      ))}
      <div className="skeleton-dark h-12 w-full rounded-lg mt-6"></div>
    </div>
  );
}
