import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import { readFileAsDataUrl } from '../utils/fileUtils'

const initialForm = {
  name: '',
  phone: '',
  address: '',
  password: '',
  paymentMethod: '',
  transactionId: '',
  senderPhone: '',
  paymentNote: '',
  proofImageUrl: '',
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [registrationFee, setRegistrationFee] = useState(0)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadingProof, setUploadingProof] = useState(false)

  useEffect(() => {
    api.get('/settings/public').then((response) => {
      setRegistrationFee(response.data.data.settings.registrationFee || 0)
    })
  }, [])

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      await api.post('/registrations', form)
      setForm(initialForm)
      setMessage('Registration submitted. Please wait for admin approval.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const uploadProof = async (file) => {
    if (!file) {
      return
    }

    setUploadingProof(true)
    setMessage('')

    try {
      const image = await readFileAsDataUrl(file)
      const response = await api.post('/uploads/payment-proof', {
        image,
        name: `registration-${Date.now()}`,
      })
      setForm((current) => ({
        ...current,
        proofImageUrl: response.data.data.image.url,
      }))
      setMessage('Payment proof uploaded.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setUploadingProof(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-950">Member Registration</h1>
          <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            Fee: Tk {registrationFee}
          </span>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Name" name="name" onChange={handleChange} required value={form.name} />
          <Field label="Phone" name="phone" onChange={handleChange} required value={form.phone} />
          <Field
            className="md:col-span-2"
            label="Address"
            name="address"
            onChange={handleChange}
            required
            value={form.address}
          />
          <Field
            label="Password"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
          <Field
            label="Payment Method"
            name="paymentMethod"
            onChange={handleChange}
            placeholder="bKash or Nagad"
            required
            value={form.paymentMethod}
          />
          <Field
            label="Transaction ID"
            name="transactionId"
            onChange={handleChange}
            required
            value={form.transactionId}
          />
          <Field
            label="Sender Phone"
            name="senderPhone"
            onChange={handleChange}
            required
            value={form.senderPhone}
          />
          <Field
            label="Payment Note"
            name="paymentNote"
            onChange={handleChange}
            textarea
            value={form.paymentNote}
          />
          <Field
            label="Payment Proof URL"
            name="proofImageUrl"
            onChange={handleChange}
            value={form.proofImageUrl}
          />
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Upload Payment Proof</span>
            <input
              accept="image/*"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              disabled={uploadingProof}
              onChange={(event) => uploadProof(event.target.files?.[0])}
              type="file"
            />
          </label>
          {uploadingProof ? (
            <p className="md:col-span-2 text-sm font-medium text-emerald-700">
              Uploading payment proof...
            </p>
          ) : null}
          {message ? (
            <p className="md:col-span-2 text-sm font-medium text-emerald-700">{message}</p>
          ) : null}
          <Button className="md:col-span-2" disabled={submitting} icon={Send} type="submit">
            {submitting ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </form>
      </Panel>
    </main>
  )
}
