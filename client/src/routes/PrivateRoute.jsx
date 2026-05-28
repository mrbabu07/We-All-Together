import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { ACCOUNT_STATUS_PATHS, getAccountStatusPath, getDashboardPath, getReturnUrl } from '../utils/authState'

export default function PrivateRoute() {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm font-medium text-gray-600">Loading account...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to={getReturnUrl(location)} />
  }

  const statusPath = getAccountStatusPath(user)

  if (statusPath && location.pathname !== statusPath) {
    return <Navigate replace to={statusPath} />
  }

  if (!statusPath && ACCOUNT_STATUS_PATHS.includes(location.pathname)) {
    return <Navigate replace to={getDashboardPath(user)} />
  }

  return <Outlet />
}
