import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import api, { getErrorMessage } from '../api/http'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import Panel from '../components/ui/Panel'
import Skeleton from '../components/ui/Skeleton'
import { apiObject } from '../utils/responseUtils'

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

const rejectionSchema = z.object({
  reason: z.string().trim().min(1, 'Payment rejection reason is required.'),
})

export default function VerifyPaymentPage() {
  const { paymentId } = useParams()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [payment, setPayment] = useState(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const {
    formState: { errors: rejectErrors, isSubmitting: isRejecting },
    handleSubmit: handleRejectSubmit,
    register: registerReject,
    reset: resetReject,
  } = useForm({
    defaultValues: { reason: '' },
    resolver: zodResolver(rejectionSchema),
  })

  const loadPayment = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await api.get(`/admin/payments/${paymentId}`)
      setPayment(apiObject(response, 'payment', null))
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

  const closeRejectModal = () => {
    setRejectModalOpen(false)
    resetReject({ reason: '' })
  }

  const rejectPayment = async ({ reason }) => {
    if (!payment?._id) {
      return
    }

    await runAction(async () => {
      await api.patch(`/admin/payments/${payment._id}/reject`, { reason })
      closeRejectModal()
    }, 'Payment rejected successfully.')
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">QR Verification</p>
          <h1 className="text-2xl font-bold text-gray-950">Payment Verification</h1>
        </div>
        <Button icon={RefreshCw} onClick={loadPayment} variant="secondary">
          Refresh
        </Button>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
          {message}
        </p>
      ) : null}

      <Panel className="mt-6">
        {loading ? <Skeleton rows={4} /> : null}
        {!loading && !payment ? (
          <p className="text-sm text-gray-600">Payment not found.</p>
        ) : null}
        {payment ? (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  {payment.user?.name || 'Member payment'}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{payment.user?.phone}</p>
                <p className="mt-1 text-sm text-gray-600">{payment.user?.address}</p>
              </div>
              <Badge value={payment.status}>{payment.status}</Badge>
            </div>

            <div className="grid gap-3 rounded-md border border-gray-200 p-4 md:grid-cols-2">
              <Info label="Month" value={payment.month} />
              <Info label="Amount" value={money(payment.amount)} />
              <Info label="Method" value={payment.method} />
              <Info label="Transaction ID" value={payment.transactionId} />
              <Info label="Sender Phone" value={payment.senderPhone} />
              <Info label="Receipt" value={payment.receiptNumber || `PAY-${payment._id}`} />
              {payment.rejectionReason ? (
                <Info label="Rejection Reason" value={payment.rejectionReason} />
              ) : null}
            </div>

            {payment.qrCodeDataUrl ? (
              <div className="grid gap-2 rounded-md border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700">Verification QR</p>
                <img alt="" className="h-36 w-36 rounded-md border border-gray-200" src={payment.qrCodeDataUrl} />
                <p className="break-all text-xs text-gray-500">{payment.verificationUrl}</p>
              </div>
            ) : null}

            {payment.proofImageUrl ? (
              <a
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
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
                    () => api.patch(`/admin/payments/${payment._id}/verify`),
                    'Payment verified successfully.',
                  )
                }
              >
                Confirm Payment
              </Button>
              <Button
                disabled={payment.status === 'rejected' || isRejecting}
                icon={XCircle}
                onClick={() => setRejectModalOpen(true)}
                variant="danger"
              >
                Reject Payment
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>

      <Modal onClose={closeRejectModal} open={rejectModalOpen} title="Reject Payment">
        <form className="grid gap-4" onSubmit={handleRejectSubmit(rejectPayment)}>
          <p className="text-sm text-gray-600">
            Add the reason for rejecting this payment. The member will see this reason before
            resubmitting.
          </p>
          <Field
            error={rejectErrors.reason?.message}
            label="Reason"
            required
            textarea
            {...registerReject('reason')}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={closeRejectModal} type="button" variant="secondary">
              Cancel
            </Button>
            <Button icon={XCircle} loading={isRejecting} type="submit" variant="danger">
              Reject Payment
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-950">{value || 'N/A'}</p>
    </div>
  )
}
