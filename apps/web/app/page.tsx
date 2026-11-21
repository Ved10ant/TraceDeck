export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl space-y-4">
        <div className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-800/80 rounded-full">
          All Systems Operational
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
          TraceDeck
        </h1>
        <p className="text-slate-400 text-lg">
          Developer-first API Observability & Incident Management SaaS.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <a
            href="/monitors"
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white transition shadow-lg shadow-emerald-900/30"
          >
            Open Dashboard
          </a>
          <a
            href="https://github.com/Ved10ant/TraceDeck"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium text-slate-200 transition border border-slate-700"
          >
            GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
