import { Link, useLocation } from 'react-router-dom'
import { Clock3, Home, LogOut, ShieldAlert, XCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import useAuth from '../hooks/useAuth'

const statusContent = {
  pending: {
    icon: Clock3,
    title: 'আপনার আবেদন অপেক্ষমাণ',
    description:
      'অ্যাডমিন আপনার নিবন্ধন যাচাই করছেন। অনুমোদন হলে আপনি সদস্য ড্যাশবোর্ড ব্যবহার করতে পারবেন।',
  },
  rejected: {
    icon: XCircle,
    title: 'আপনার নিবন্ধন অনুমোদিত হয়নি',
    description:
      'অ্যাডমিন আপনার নিবন্ধন বাতিল করেছেন। প্রয়োজনে সংগঠনের দায়িত্বশীল ব্যক্তির সাথে যোগাযোগ করুন।',
  },
  suspended: {
    icon: ShieldAlert,
    title: 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত',
    description:
      'আপনি এখন ড্যাশবোর্ড ব্যবহার করতে পারবেন না। বিস্তারিত জানতে অ্যাডমিনের সাথে যোগাযোগ করুন।',
  },
}

export default function AccountStatusPage() {
  const { logout, user } = useAuth()
  const location = useLocation()
  const statusKey = location.pathname.replace('/', '')
  const content = statusContent[statusKey] || statusContent.pending
  const Icon = content.icon
  const reason =
    statusKey === 'suspended'
      ? user?.suspensionReason
      : user?.registrationPayment?.note || user?.deleteRequestReason

  return (
    <main className="mx-auto grid min-h-screen max-w-4xl place-items-center px-4 py-10 sm:px-6">
      <Panel className="w-full max-w-2xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--brand-50)] text-[var(--brand-700)]">
          <Icon aria-hidden="true" className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          {content.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
          {content.description}
        </p>
        {reason ? (
          <div className="mx-auto mt-6 max-w-xl rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-[var(--surface-1)] p-4 text-left">
            <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">কারণ</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{reason}</p>
          </div>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button as={Link} icon={Home} to="/">
            হোমে যান
          </Button>
          <Button icon={LogOut} onClick={logout} variant="secondary">
            লগআউট
          </Button>
        </div>
      </Panel>
    </main>
  )
}
