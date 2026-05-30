import usePermission from '../../hooks/usePermission'

export default function PermissionGate({ children, fallback = null, permission }) {
  const allowed = usePermission(permission)

  if (!allowed) {
    return fallback
  }

  return children
}
