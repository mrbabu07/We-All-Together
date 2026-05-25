import { Link } from 'react-router-dom'
import Panel from '../components/ui/Panel'

export default function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl place-items-center px-4 py-10 sm:px-6">
      <Panel className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-950">Page Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">The requested page does not exist.</p>
        <Link
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
          to="/"
        >
          Go Home
        </Link>
      </Panel>
    </main>
  )
}
