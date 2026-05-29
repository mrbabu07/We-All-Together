import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { HeartHandshake, RefreshCw, Send, Upload } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import api, { getErrorMessage } from '../api/http'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import Skeleton from '../components/ui/Skeleton'
import useAuth from '../hooks/useAuth'
import { readFileAsDataUrl } from '../utils/fileUtils'

const quickAmounts = [500, 1000, 2000, 5000]

const initialDonationForm = {
  amount: '1000',
  anonymous: false,
  donorName: '',
  method: '',
  note: '',
  phone: '',
  proofImageUrl: '',
  transactionId: '',
}

const donationSchema = z
  .object({
    amount: z.coerce.number().min(1, 'Donation amount is required.'),
    anonymous: z.boolean(),
    donorName: z.string().trim(),
    method: z.string().trim().min(1, 'Payment method is required.'),
    note: z.string().trim().max(300, 'Message cannot exceed 300 characters.').optional(),
    phone: z.string().trim().min(1, 'Phone number is required.'),
    proofImageUrl: z.string().trim().min(1, 'Payment screenshot is required.'),
    transactionId: z.string().trim().min(1, 'Transaction ID is required.'),
  })
  .superRefine((values, context) => {
    if (!values.anonymous && !values.donorName) {
      context.addIssue({
        code: 'custom',
        message: 'Name is required unless anonymous is selected.',
        path: ['donorName'],
      })
    }
  })

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

const formatDate = (value) => {
  if (!value) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function MemberDonatePage() {
  const { user } = useAuth()
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [settings, setSettings] = useState({})
  const [uploading, setUploading] = useState(false)
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm({
    defaultValues: initialDonationForm,
    resolver: zodResolver(donationSchema),
  })
  const [amount, anonymous, donorName, phone] = useWatch({
    control,
    name: ['amount', 'anonymous', 'donorName', 'phone'],
  })

  const loadDonations = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const [settingsResponse, donationsResponse] = await Promise.all([
        api.get('/public/settings'),
        api.get('/member/donations/my'),
      ])

      setSettings(settingsResponse.data.data.settings || {})
      setDonations(donationsResponse.data.data.donations || [])
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDonations()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDonations])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (user?.name && !donorName) {
        setValue('donorName', user.name)
      }
      if (user?.phone && !phone) {
        setValue('phone', user.phone)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [donorName, phone, setValue, user?.name, user?.phone])

  const totals = useMemo(() => {
    return donations.reduce(
      (summary, donation) => {
        const amount = Number(donation.amount || 0)
        summary.all += amount
        if (donation.status === 'verified') {
          summary.verified += amount
        }
        if (donation.status === 'pending') {
          summary.pending += amount
        }
        return summary
      },
      { all: 0, pending: 0, verified: 0 },
    )
  }, [donations])

  const uploadProof = async (file) => {
    if (!file) {
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const image = await readFileAsDataUrl(file)
      const response = await api.post('/member/uploads/payment-proof', {
        image,
        name: `member-donation-${Date.now()}`,
      })
      setValue('proofImageUrl', response.data.data.image.url, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setMessage('Payment screenshot uploaded.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  const submitDonation = async (values) => {
    setMessage('')

    try {
      await api.post('/member/donations/my', values)
      reset({
        ...initialDonationForm,
        donorName: user?.name || '',
        phone: user?.phone || '',
      })
      await loadDonations()
      setMessage('Donation submitted. Admin will verify it soon.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--brand-700)]">দান</p>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Member Donation</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            আপনার প্রোফাইল থেকে দান জমা দিন এবং স্ট্যাটাস দেখুন।
          </p>
        </div>
        <Button icon={RefreshCw} onClick={loadDonations} variant="secondary">
          Refresh
        </Button>
      </div>

      {loading ? (
        <Panel className="mt-6">
          <Skeleton rows={6} />
        </Panel>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid gap-6">
            <Panel>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-600)]">
                  <HeartHandshake aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Payment Info</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Send money first, then submit the transaction details.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoBox label="Number" value={settings.donationNumber || 'Admin has not set a number yet'} />
                <InfoBox label="Method" value={settings.donationProvider || 'bKash / Nagad'} />
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard label="All time" value={money(totals.all)} />
              <SummaryCard label="Verified" value={money(totals.verified)} />
              <SummaryCard label="Pending" value={money(totals.pending)} />
            </div>
          </div>

          <Panel>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">দান জমা দিন</h2>
            <form className="mt-5 grid gap-4" onSubmit={handleSubmit(submitDonation)}>
              <div>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">Quick amount</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      className={`min-h-11 rounded-[var(--radius-md)] border px-3 text-sm font-semibold transition ${
                        Number(amount) === quickAmount
                          ? 'border-[var(--brand-600)] bg-[var(--brand-50)] text-[var(--brand-700)]'
                          : 'border-[var(--gray-200)] bg-[var(--surface-0)] text-[var(--text-secondary)] hover:border-[var(--brand-300)]'
                      }`}
                      key={quickAmount}
                      onClick={() =>
                        setValue('amount', String(quickAmount), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      type="button"
                    >
                      {money(quickAmount)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  error={errors.amount?.message}
                  label="Amount"
                  min="1"
                  type="number"
                  {...register('amount')}
                />
                <Field
                  error={errors.method?.message}
                  label="Payment Method"
                  placeholder={settings.donationProvider || 'bKash / Nagad'}
                  {...register('method')}
                />
                <Field
                  disabled={anonymous}
                  error={errors.donorName?.message}
                  label="Name"
                  {...register('donorName')}
                />
                <Field error={errors.phone?.message} label="Phone" {...register('phone')} />
                <Field
                  error={errors.transactionId?.message}
                  label="Transaction ID"
                  {...register('transactionId')}
                />
                <Field
                  error={errors.proofImageUrl?.message}
                  label="Proof URL"
                  {...register('proofImageUrl')}
                />
              </div>

              <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-[var(--surface-0)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
                <Upload aria-hidden="true" className="h-4 w-4 text-[var(--brand-600)]" />
                <span>{uploading ? 'Uploading screenshot...' : 'Upload payment screenshot'}</span>
                <input
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => uploadProof(event.target.files?.[0])}
                  type="file"
                />
              </label>

              <Field error={errors.note?.message} label="Message" textarea {...register('note')} />
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <input {...register('anonymous')} type="checkbox" />
                Anonymous হিসেবে দেখান
              </label>

              {message ? (
                <p className="rounded-[var(--radius-md)] border border-[var(--brand-100)] bg-[var(--brand-50)] px-4 py-3 text-sm font-semibold text-[var(--brand-800)]">
                  {message}
                </p>
              ) : null}

              <Button icon={Send} loading={isSubmitting} size="lg" type="submit">
                Submit Donation
              </Button>
            </form>
          </Panel>
        </div>
      )}

      {!loading ? (
        <Panel className="mt-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">My Donation History</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Pending, verified, and rejected submissions.</p>
            </div>
            <Badge value={`${donations.length}`}>{donations.length} records</Badge>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[760px] divide-y divide-[var(--gray-200)] text-left text-sm">
              <thead className="bg-[var(--surface-1)] text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {donations.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[var(--text-muted)]" colSpan={6}>
                      No donations submitted yet.
                    </td>
                  </tr>
                ) : null}
                {donations.map((donation) => (
                  <tr className="align-top" key={donation._id}>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(donation.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{money(donation.amount)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{donation.method}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{donation.transactionId}</td>
                    <td className="max-w-xs px-4 py-3 text-[var(--text-secondary)]">{donation.note || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge value={donation.status}>{donation.status}</Badge>
                      {donation.rejectionReason ? (
                        <p className="mt-1 text-xs font-medium text-[var(--danger)]">{donation.rejectionReason}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </main>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-[var(--surface-1)] p-4">
      <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <Panel className="p-4">
      <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </Panel>
  )
}
