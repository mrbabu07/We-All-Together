import { Link } from 'react-router-dom'
import { HeartHandshake, LogIn, UserPlus } from 'lucide-react'
import Panel from '../components/ui/Panel'

export default function PublicHomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="py-8">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Village organization system
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Dargah Para OIkko Porishod
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Manage registration, dues, meetings, notices, donations, tours, activities, and rules
            from one shared system.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              to="/register"
            >
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              Register
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              to="/login"
            >
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Login
            </Link>
          </div>
        </div>

        <Panel>
          <HeartHandshake className="h-8 w-8 text-emerald-700" />
          <h2 className="mt-4 text-xl font-bold text-slate-950">Community Fund</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Public visitors can donate, and admins can verify every donation before it appears in
            finance totals.
          </p>
        </Panel>
      </section>
    </main>
  )
}
