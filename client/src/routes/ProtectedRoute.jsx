import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function ProtectedRoute() {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm font-medium text-slate-600">Loading account...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}
