import useAuth from '../hooks/useAuth'
import { isStaffUser } from '../utils/permissionUtils'
import AdminLayout from './AdminLayout'
import MemberLayout from './MemberLayout'

export default function AuthenticatedLayout() {
  const { user } = useAuth()

  return isStaffUser(user) ? <AdminLayout /> : <MemberLayout />
}
