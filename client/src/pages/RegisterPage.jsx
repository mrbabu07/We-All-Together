import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'

const initialForm = {
  name: '',
  phone: '',
  address: '',
  password: '',
  paymentMethod: '',
  transactionId: '',
  senderPhone: '',
  paymentNote: '',
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [registrationFee, setRegistrationFee] = useState(0)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
