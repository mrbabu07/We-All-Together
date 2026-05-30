import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { getReturnUrl } from '../utils/authState'

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()
  const isCustomStaffMember =
    allowedRoles.includes('member') &&
    user?.role &&
    !['admin', 'member', 'moderator'].includes(user.role)

  if (!allowedRoles.includes(user?.role) && !isCustomStaffMember) {
    return <Navigate replace state={{ from: location }} to={getReturnUrl(location)} />
  }

  return <Outlet />
}
