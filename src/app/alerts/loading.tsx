export default function AlertsLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-80 bg-zinc-800/50 rounded animate-pulse mt-2" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/30"
            >
              <div className="flex items-center gap-4">
                <div className="h-5 w-16 bg-zinc-800/40 rounded-full animate-pulse" />
                <div>
                  <div className="h-4 w-36 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-zinc-800/50 rounded animate-pulse mt-2" />
                </div>
              </div>
              <div className="h-3 w-12 bg-zinc-800/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
