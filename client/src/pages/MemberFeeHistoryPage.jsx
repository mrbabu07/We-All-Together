import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock3, Download, FileText, RefreshCw, XCircle } from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import Skeleton from '../components/ui/Skeleton'

const moneyPaisa = (value = 0) => `৳${(Number(value || 0) / 100).toLocaleString('bn-BD')}`

const statusTone = {
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  future: 'border-gray-200 bg-gray-50 text-gray-400',
  not_applicable: 'border-gray-100 bg-gray-50 text-gray-400',
  overdue: 'border-red-200 bg-red-50 text-red-700',
  pending: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  unpaid: 'border-red-100 bg-red-50 text-red-600',
  waived: 'border-gray-200 bg-gray-100 text-gray-600',
}

const statusLabel = {
  approved: 'পরিশোধিত',
  future: '--',
  not_applicable: 'প্রযোজ্য নয়',
  overdue: 'বকেয়া',
  pending: 'যাচাই চলছে',
  unpaid: 'বকেয়া',
  waived: 'মওকুফ',
}

const statusIcon = {
  approved: CheckCircle2,
  overdue: XCircle,
  pending: Clock3,
  unpaid: XCircle,
  waived: FileText,
}

export default function MemberFeeHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [data, setData] = useState({
    grid: [],
    payments: [],
    status: { totalDuePaisa: 0, paymentHistory: [] },
    years: [new Date().getFullYear()],
  })

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await api.get('/fees/my-history', { params: { year: selectedYear } })
      setData(response.data.data)
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    const timer = window.setTimeout(loadHistory, 0)
    return () => window.clearTimeout(timer)
  }, [loadHistory])

  const approvedPayments = data.payments.filter((payment) => payment.status === 'verified')
  const totalPaidPaisa = approvedPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaisa || payment.amount * 100 || 0),
    0,
  )
  const yearlyPaidPaisa = approvedPayments
    .filter((payment) =>
      (payment.coveredMonths || []).some((item) => Number(item.year) === Number(selectedYear)),
    )
    .reduce((sum, payment) => sum + Number(payment.amountPaisa || payment.amount * 100 || 0), 0)

  const downloadReceipt = async (id) => {
    const response = await api.get(`/receipts/${id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `fee-receipt-${id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">ফি ইতিহাস</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            আমার ফি পরিশোধের ইতিহাস
          </h1>
        </div>
        <Button icon={RefreshCw} onClick={loadHistory} variant="secondary">
          রিফ্রেশ
        </Button>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </p>
      ) : null}

      {loading ? (
        <Panel className="mt-6">
          <Skeleton rows={6} />
        </Panel>
      ) : (
        <div className="mt-6 grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="মোট পরিশোধিত" value={moneyPaisa(totalPaidPaisa)} />
            <SummaryCard label="এই বছর পরিশোধিত" value={moneyPaisa(yearlyPaidPaisa)} />
            <SummaryCard
              danger={data.status.totalDuePaisa > 0}
              label="বর্তমান বকেয়া"
              value={moneyPaisa(data.status.totalDuePaisa)}
            />
            <SummaryCard label="সদস্যপদ থেকে মোট দেয়" value={moneyPaisa(totalPaidPaisa)} />
          </div>

          <Panel>
            <div className="flex flex-wrap gap-2">
              {data.years.map((year) => (
                <button
                  className={`min-h-11 rounded-lg px-4 text-sm font-bold transition ${
                    Number(selectedYear) === Number(year)
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  type="button"
                >
                  {Number(year).toLocaleString('bn-BD', { useGrouping: false })}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.grid.map((item) => {
                const Icon = statusIcon[item.status] || FileText

                return (
                  <div
                    className={`rounded-xl border p-4 ${statusTone[item.status] || statusTone.future}`}
                    key={`${item.year}-${item.month}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{item.label}</p>
                        <p className="mt-1 text-sm">{moneyPaisa(item.amountPaisa)}</p>
                      </div>
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold">{statusLabel[item.status]}</p>
                    {item.status === 'overdue' ? (
                      <a className="mt-2 inline-flex text-sm font-bold text-red-700 underline" href="/member/fees">
                        পরিশোধ করুন
                      </a>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Payment history</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-bold uppercase text-gray-500">
                  <tr>
                    {['তারিখ', 'মাস সমূহ', 'পরিমাণ', 'বিলম্ব ফি', 'অবস্থা', 'রসিদ'].map((heading) => (
                      <th className="px-4 py-3" key={heading}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.payments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-4 py-3">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('bn-BD') : 'N/A'}</td>
                      <td className="px-4 py-3">
                        {(payment.coveredMonths || []).map((item) => `${item.month}/${item.year}`).join(', ') || payment.month}
                      </td>
                      <td className="px-4 py-3 font-bold">{moneyPaisa(payment.amountPaisa || payment.amount * 100)}</td>
                      <td className="px-4 py-3">{moneyPaisa(payment.lateFeeAppliedPaisa || payment.lateFeeApplied * 100 || 0)}</td>
                      <td className="px-4 py-3"><Badge value={payment.status}>{payment.status}</Badge></td>
                      <td className="px-4 py-3">
                        {payment.status === 'verified' ? (
                          <Button icon={Download} onClick={() => downloadReceipt(payment._id)} variant="secondary">
                            PDF
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </main>
  )
}

function SummaryCard({ danger = false, label, value }) {
  return (
    <Panel>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${danger ? 'text-red-600' : 'text-gray-950'}`}>
        {value}
      </p>
    </Panel>
  )
}
