export default function CollectionLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="h-4 w-28 bg-zinc-800/50 rounded animate-pulse" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-zinc-800 animate-pulse" />
          <div>
            <div className="h-7 w-48 bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 w-64 bg-zinc-800/50 rounded animate-pulse mt-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
            >
              <div className="h-3 w-16 bg-zinc-700/50 rounded animate-pulse" />
              <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>

        <div>
          <div className="h-5 w-36 bg-zinc-800 rounded animate-pulse mb-3" />
          <div className="h-64 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </main>
  );
}
