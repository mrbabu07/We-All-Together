import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getReturnUrl } from '../utils/authState'
import {
  canAccessRequirement,
  getAdminRouteRequirement,
  isStaffUser,
} from '../utils/permissionUtils'

export default function AdminRoute() {
  const { user } = useAuth()
  const location = useLocation()
  const isAdminAreaUser = user?.role === 'admin' || isStaffUser(user)
  const requirement = getAdminRouteRequirement(location.pathname)

  if (location.pathname === '/admin/unauthorized') {
    return isAdminAreaUser ? <Outlet /> : <Navigate replace state={{ from: location }} to={getReturnUrl(location)} />
  }

  if (!isAdminAreaUser) {
    return <Navigate replace state={{ from: location }} to={getReturnUrl(location)} />
  }

  if (!canAccessRequirement(user, requirement)) {
    return <Navigate replace state={{ from: location, required: requirement }} to="/admin/unauthorized" />
  }

  return <Outlet />
}
