const milestones = [
  'Project setup',
  'Backend setup',
  'Auth system',
  'Admin approval',
]

function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Dargah Para OIkko Porishod
          </p>
          <p className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
            Step 1 ready
          </p>
        </header>

        <div className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase text-cyan-700">
              MERN management system
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              A clean foundation for village organization management.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              The app is being built step by step with React, Tailwind, Express,
              MongoDB, JWT, and role-based access.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Build Milestones
            </h2>
            <div className="mt-5 space-y-3">
              {milestones.map((milestone, index) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-4 py-3"
                  key={milestone}
                >
                  <span className="text-sm font-medium text-slate-700">
                    {milestone}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {index === 0 ? 'Done' : 'Next'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
