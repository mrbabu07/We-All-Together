import useAuth from '../hooks/useAuth'
import AdminLayout from './AdminLayout'
import MemberLayout from './MemberLayout'

export default function AuthenticatedLayout() {
  const { user } = useAuth()

  return user?.role === 'admin' ? <AdminLayout /> : <MemberLayout />
}
