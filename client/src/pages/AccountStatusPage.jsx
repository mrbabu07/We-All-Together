import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Clock3, Home, LogOut, ShieldAlert, XCircle } from 'lucide-react'
import api from '../api/http'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import useAuth from '../hooks/useAuth'

const RE_REGISTRATION_WAIT_MS = 30 * 24 * 60 * 60 * 1000

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

const formatDate = (value) => {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value)
}

const getReRegistrationDate = (user) => {
  const dateValue = user?.rejectedAt || user?.updatedAt || user?.createdAt

  if (!dateValue) {
    return null
  }

  return new Date(new Date(dateValue).getTime() + RE_REGISTRATION_WAIT_MS)
}

export default function AccountStatusPage() {
  const { logout, user } = useAuth()
  const location = useLocation()
  const [siteSettings, setSiteSettings] = useState(null)
  const statusKey = location.pathname.replace('/', '')
  const content = statusContent[statusKey] || statusContent.pending
  const Icon = content.icon
  const reason =
    statusKey === 'suspended'
      ? user?.suspensionReason
      : user?.registrationPayment?.note || user?.deleteRequestReason
  const reRegistrationDate = statusKey === 'rejected' ? getReRegistrationDate(user) : null
  const canRegisterAgain = !reRegistrationDate || reRegistrationDate <= new Date()
  const contactItems = useMemo(
    () =>
      [
        ['Phone', siteSettings?.contactNumber],
        ['Email', siteSettings?.email],
        ['WhatsApp', siteSettings?.whatsappGroupUrl],
        ['Address', siteSettings?.address],
      ].filter(([, value]) => Boolean(value)),
    [siteSettings],
  )

  useEffect(() => {
    let active = true

    api
      .get('/public/settings')
      .then((response) => {
        if (active) {
          setSiteSettings(response.data.data.settings?.siteSettings || null)
        }
      })
      .catch(() => {
        if (active) {
          setSiteSettings(null)
        }
      })

    return () => {
      active = false
    }
  }, [])

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
        {statusKey === 'pending' ? (
          <div className="mx-auto mt-6 max-w-xl rounded-[var(--radius-md)] border border-[var(--brand-200)] bg-[var(--brand-50)] p-4 text-left">
            <p className="text-xs font-semibold uppercase text-[var(--brand-700)]">
              Estimated approval
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              Admin review usually completes within 1-3 working days after document and payment
              verification.
            </p>
          </div>
        ) : null}
        {statusKey === 'rejected' && reRegistrationDate ? (
          <div className="mx-auto mt-6 max-w-xl rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-[var(--surface-1)] p-4 text-left">
            <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
              Re-registration
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {canRegisterAgain
                ? 'You can submit a new registration now.'
                : `You can re-register after ${formatDate(reRegistrationDate)}.`}
            </p>
          </div>
        ) : null}
        {contactItems.length ? (
          <div className="mx-auto mt-6 grid max-w-xl gap-2 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-[var(--surface-0)] p-4 text-left">
            <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
              Contact admin
            </p>
            {contactItems.map(([label, value]) => (
              <p className="break-words text-sm font-medium text-[var(--text-primary)]" key={label}>
                <span className="text-[var(--text-muted)]">{label}:</span> {value}
              </p>
            ))}
          </div>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button as={Link} icon={Home} to="/">
            হোমে যান
          </Button>
          {statusKey === 'rejected' ? (
            <Button
              as={Link}
              disabled={!canRegisterAgain}
              icon={Clock3}
              to="/register"
              variant="secondary"
            >
              Register again
            </Button>
          ) : null}
          <Button icon={LogOut} onClick={logout} variant="secondary">
            লগআউট
          </Button>
        </div>
      </Panel>
    </main>
  )
}
