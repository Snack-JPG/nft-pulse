export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-96 bg-zinc-800/50 rounded animate-pulse mt-2" />
        </div>
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          {/* Header row */}
          <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-3 flex gap-4">
            {[32, 120, 80, 80, 96, 80, 64, 64, 72].map((w, i) => (
              <div
                key={i}
                className="h-4 bg-zinc-700/50 rounded animate-pulse"
                style={{ width: w }}
              />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-zinc-800/50 px-4 py-3 flex items-center gap-4"
            >
              <div className="h-4 w-6 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-20 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-4 w-20 bg-purple-900/20 rounded animate-pulse" />
              <div className="h-6 w-24 bg-zinc-800/40 rounded animate-pulse" />
              <div className="h-4 w-20 bg-purple-900/20 rounded animate-pulse" />
              <div className="h-4 w-12 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-4 w-12 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-5 w-16 bg-zinc-800/40 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
