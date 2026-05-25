import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../api/http'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

export default function VerifyPaymentPage() {
  const { paymentId } = useParams()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [payment, setPayment] = useState(null)

  const loadPayment = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await api.get(`/payments/${paymentId}`)
      setPayment(response.data.data.payment)
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [paymentId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPayment()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPayment])

  const runAction = async (action, successMessage) => {
    try {
      setMessage('')
      await action()
      setMessage(successMessage)
      await loadPayment()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">QR Verification</p>
          <h1 className="text-2xl font-bold text-slate-950">Payment Verification</h1>
        </div>
        <Button icon={RefreshCw} onClick={loadPayment} variant="secondary">
          Refresh
        </Button>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </p>
      ) : null}

      <Panel className="mt-6">
        {loading ? <p className="text-sm text-slate-600">Loading payment...</p> : null}
        {!loading && !payment ? (
          <p className="text-sm text-slate-600">Payment not found.</p>
        ) : null}
        {payment ? (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {payment.user?.name || 'Member payment'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{payment.user?.phone}</p>
                <p className="mt-1 text-sm text-slate-600">{payment.user?.address}</p>
              </div>
              <Badge value={payment.status}>{payment.status}</Badge>
            </div>

            <div className="grid gap-3 rounded-md border border-slate-200 p-4 md:grid-cols-2">
              <Info label="Month" value={payment.month} />
              <Info label="Amount" value={money(payment.amount)} />
              <Info label="Method" value={payment.method} />
              <Info label="Transaction ID" value={payment.transactionId} />
              <Info label="Sender Phone" value={payment.senderPhone} />
              <Info label="Receipt" value={payment.receiptNumber || `PAY-${payment._id}`} />
            </div>

            {payment.qrCodeDataUrl ? (
              <div className="grid gap-2 rounded-md border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700">Verification QR</p>
                <img alt="" className="h-36 w-36 rounded-md border border-slate-200" src={payment.qrCodeDataUrl} />
                <p className="break-all text-xs text-slate-500">{payment.verificationUrl}</p>
              </div>
            ) : null}

            {payment.proofImageUrl ? (
              <a
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                href={payment.proofImageUrl}
                rel="noreferrer"
                target="_blank"
              >
                View payment proof
              </a>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={payment.status === 'verified'}
                icon={CheckCircle2}
                onClick={() =>
                  runAction(
                    () => api.patch(`/payments/${payment._id}/verify`),
                    'Payment verified successfully.',
                  )
                }
              >
                Confirm Payment
              </Button>
              <Button
                disabled={payment.status === 'rejected'}
                icon={XCircle}
                onClick={() =>
                  runAction(
                    () => api.patch(`/payments/${payment._id}/reject`),
                    'Payment rejected successfully.',
                  )
                }
                variant="danger"
              >
                Reject Payment
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>
    </main>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value || 'N/A'}</p>
    </div>
  )
}
