import { useEffect, useState } from 'react'
import { CreditCard, Send, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
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
  const [step, setStep] = useState(1)
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
      setStep(1)
      setMessage('Registration submitted. Please wait for admin approval.')
      toast.success('নিবন্ধন জমা হয়েছে')
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setMessage(errorMessage)
      toast.error(errorMessage)
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
      toast.success('পেমেন্ট প্রমাণ আপলোড হয়েছে')
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUploadingProof(false)
    }
  }

  const goNext = () => {
    if (!form.name || !form.phone || !form.address || !form.password) {
      setMessage('ব্যক্তিগত তথ্য পূরণ করুন।')
      return
    }

    setMessage('')
    setStep(2)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">সদস্য নিবন্ধন</h1>
            <p className="mt-1 text-sm text-gray-500">ব্যক্তিগত তথ্য → পেমেন্ট তথ্য → জমা দিন</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
            Fee: Tk {registrationFee}
          </span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div
            className={`rounded-xl border p-3 ${
              step === 1 ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200'
            }`}
          >
            <UserRound aria-hidden="true" className="h-5 w-5" />
            <p className="mt-2 text-sm font-semibold">ব্যক্তিগত তথ্য</p>
          </div>
          <div
            className={`rounded-xl border p-3 ${
              step === 2 ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-200'
            }`}
          >
            <CreditCard aria-hidden="true" className="h-5 w-5" />
            <p className="mt-2 text-sm font-semibold">পেমেন্ট তথ্য</p>
          </div>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <Field label="নাম" name="name" onChange={handleChange} required value={form.name} />
              <Field label="ফোন" name="phone" onChange={handleChange} required value={form.phone} />
              <Field
                className="md:col-span-2"
                label="ঠিকানা"
                name="address"
                onChange={handleChange}
                required
                value={form.address}
              />
              <Field
                label="পাসওয়ার্ড"
                name="password"
                onChange={handleChange}
                required
                type="password"
                value={form.password}
              />
            </>
          ) : (
            <>
              <Field
                label="পেমেন্ট মাধ্যম"
                name="paymentMethod"
                onChange={handleChange}
                placeholder="bKash or Nagad"
                required
                value={form.paymentMethod}
              />
              <Field
                label="ট্রানজেকশন আইডি"
                name="transactionId"
                onChange={handleChange}
                required
                value={form.transactionId}
              />
              <Field
                label="প্রেরকের ফোন"
                name="senderPhone"
                onChange={handleChange}
                required
                value={form.senderPhone}
              />
              <Field
                label="পেমেন্ট নোট"
                name="paymentNote"
                onChange={handleChange}
                textarea
                value={form.paymentNote}
              />
              <Field
                label="পেমেন্ট প্রমাণ URL"
                name="proofImageUrl"
                onChange={handleChange}
                value={form.proofImageUrl}
              />
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                <span>পেমেন্ট প্রমাণ আপলোড</span>
                <input
                  accept="image/*"
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700"
                  disabled={uploadingProof}
                  onChange={(event) => uploadProof(event.target.files?.[0])}
                  type="file"
                />
              </label>
            </>
          )}
          {uploadingProof ? (
            <p className="md:col-span-2 text-sm font-medium text-indigo-700">
              পেমেন্ট প্রমাণ আপলোড হচ্ছে...
            </p>
          ) : null}
          {message ? (
            <p className="md:col-span-2 text-sm font-medium text-indigo-700">{message}</p>
          ) : null}
          <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
            {step === 2 ? (
              <Button onClick={() => setStep(1)} variant="secondary">
                ফিরে যান
              </Button>
            ) : null}
            {step === 1 ? (
              <Button icon={Send} onClick={goNext}>
                পরবর্তী
              </Button>
            ) : (
              <Button icon={Send} loading={submitting} type="submit">
                নিবন্ধন জমা দিন
              </Button>
            )}
          </div>
        </form>
      </Panel>
    </main>
  )
}
