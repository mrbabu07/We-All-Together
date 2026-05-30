import useAuth from './useAuth'
import { hasPermission } from '../utils/permissionUtils'

export default function usePermission(permission) {
  const { user } = useAuth()
  return hasPermission(user, permission)
}
