import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getReturnUrl } from '../utils/authState'

export default function AdminRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (user?.role !== 'admin') {
    return <Navigate replace state={{ from: location }} to={getReturnUrl(location)} />
  }

  return <Outlet />
}
