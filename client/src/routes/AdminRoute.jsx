import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { MODERATOR_ADMIN_PATHS, getReturnUrl } from '../utils/authState'

export default function AdminRoute() {
  const { user } = useAuth()
  const location = useLocation()

  const canModerateHere =
    user?.role === 'moderator' && MODERATOR_ADMIN_PATHS.includes(location.pathname)

  if (user?.role !== 'admin' && !canModerateHere) {
    return <Navigate replace state={{ from: location }} to={getReturnUrl(location)} />
  }

  return <Outlet />
}
