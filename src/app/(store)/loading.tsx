export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="skeleton mb-4 h-10 rounded-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-card bg-card shadow-card">
            <div className="skeleton aspect-square" />
            <div className="space-y-2 p-3">
              <div className="skeleton h-4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="skeleton h-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
