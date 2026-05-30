import { Link, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import useAuth from '../hooks/useAuth'
import { getNavItemsForUser } from '../utils/permissionUtils'

export default function AdminUnauthorizedPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navItems = getNavItemsForUser(user).filter((item) => item.path.startsWith('/admin'))
  const required = location.state?.required?.requiredPermission || location.state?.required?.anyPermissions?.join(', ')

  return (
    <div className="grid gap-6">
      <Panel className="max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-rose-50 text-rose-600">
            <ShieldAlert aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              আপনার এই পেজ দেখার অনুমতি নেই
            </h1>
            {required ? (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                প্রয়োজনীয় অনুমতি: <span className="font-semibold">{required}</span>
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {navItems.slice(0, 5).map((item) => (
                <Button as={Link} key={item.path} to={item.path} variant="secondary">
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}
