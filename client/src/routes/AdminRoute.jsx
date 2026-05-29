import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getReturnUrl } from '../utils/authState'

const moderatorRoutes = ['/admin/blogs', '/admin/gallery']

export default function AdminRoute() {
  const { user } = useAuth()
  const location = useLocation()

  const canModerateHere =
    user?.role === 'moderator' && moderatorRoutes.includes(location.pathname)

  if (user?.role !== 'admin' && !canModerateHere) {
    return <Navigate replace state={{ from: location }} to={getReturnUrl(location)} />
  }

  return <Outlet />
}
