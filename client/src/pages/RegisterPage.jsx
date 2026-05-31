import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, Send, Upload, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import api, { getErrorMessage } from '../api/http'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import { readFileAsDataUrl } from '../utils/fileUtils'
import { apiObject, apiUploadUrl } from '../utils/responseUtils'

const initialForm = {
  name: '',
  phone: '',
  address: '',
  password: '',
  birthCertificateUrl: '',
  nidImageUrl: '',
  passportImageUrl: '',
  profilePhotoUrl: '',
  paymentMethod: '',
  transactionId: '',
  senderPhone: '',
  paymentNote: '',
  proofImageUrl: '',
}

const bangladeshPhoneSchema = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform((value) => {
      const phone = value.replace(/[\s-]/g, '')

      if (phone.startsWith('+88')) {
        return phone.slice(3)
      }

      if (phone.startsWith('88') && phone.length === 13) {
        return phone.slice(2)
      }

      return phone
    })
    .refine((value) => /^01[3-9]\d{8}$/.test(value), `${label} must use Bangladeshi format like 017XXXXXXXX.`)

const ensureIdentityDocument = (values, context) => {
  if (![values.birthCertificateUrl, values.nidImageUrl, values.passportImageUrl].some(Boolean)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one identity document is required.',
      path: ['nidImageUrl'],
    })
  }
}

const registrationBaseSchema = z.object({
  address: z.string().trim().min(1, 'Address is required.'),
  birthCertificateUrl: z.string().trim().optional(),
  name: z.string().trim().min(1, 'Name is required.'),
  nidImageUrl: z.string().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  passportImageUrl: z.string().trim().optional(),
  paymentMethod: z.string().trim().min(1, 'Payment method is required.'),
  paymentNote: z.string().trim().max(300, 'Payment note cannot exceed 300 characters.').optional(),
  phone: bangladeshPhoneSchema('Phone'),
  profilePhotoUrl: z.string().trim().optional(),
  proofImageUrl: z.string().trim().min(1, 'Payment proof is required.'),
  senderPhone: bangladeshPhoneSchema('Sender phone'),
  transactionId: z.string().trim().min(1, 'Transaction ID is required.'),
})

const registrationSchema = registrationBaseSchema.superRefine(ensureIdentityDocument)

const registrationStepOneSchema = registrationBaseSchema
  .pick({
    address: true,
    birthCertificateUrl: true,
    name: true,
    nidImageUrl: true,
    passportImageUrl: true,
    password: true,
    phone: true,
    profilePhotoUrl: true,
  })
  .superRefine(ensureIdentityDocument)

export default function RegisterPage() {
  const [paymentSettings, setPaymentSettings] = useState({
    donationNumber: '',
    donationProvider: '',
    registrationEnabled: true,
    registrationFee: 0,
  })
  const [message, setMessage] = useState('')
  const [step, setStep] = useState(1)
  const [uploadingImageField, setUploadingImageField] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm({
    defaultValues: initialForm,
    resolver: zodResolver(registrationSchema),
  })

  useEffect(() => {
    api.get('/public/settings').then((response) => {
      const settings = apiObject(response, 'settings')
      setPaymentSettings({
        donationNumber: settings.donationNumber || '',
        donationProvider: settings.donationProvider || '',
        registrationEnabled: settings.siteSettings?.registrationEnabled !== false,
        registrationFee: settings.registrationFee || 0,
      })
    })
  }, [])

  const submitRegistration = async (values) => {
    setMessage('')

    try {
      await api.post('/public/registrations', values)
      reset(initialForm)
      setStep(1)
      setMessage('Registration submitted. Please wait for admin approval.')
      toast.success('নিবন্ধন জমা হয়েছে')
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setMessage(errorMessage)
      toast.error(errorMessage)
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
      const response = await api.post('/public/uploads/payment-proof', {
        image,
        name: `registration-${Date.now()}`,
      })
      const url = apiUploadUrl(response)
      if (!url) {
        throw new Error('Upload completed but no image URL was returned.')
      }
      setValue('proofImageUrl', url, {
        shouldDirty: true,
        shouldValidate: true,
      })
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

  const uploadRegistrationImage = async (fieldName, file) => {
    if (!file) {
      return
    }

    setUploadingImageField(fieldName)
    setMessage('')

    try {
      const image = await readFileAsDataUrl(file)
      const response = await api.post('/public/uploads/profile-document', {
        image,
        name: `registration-${fieldName}-${Date.now()}`,
      })
      const url = apiUploadUrl(response)
      if (!url) {
        throw new Error('Upload completed but no image URL was returned.')
      }
      setValue(fieldName, url, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setMessage('Document uploaded.')
      toast.success('ডকুমেন্ট আপলোড হয়েছে')
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUploadingImageField('')
    }
  }

  const goNext = () => {
    const result = registrationStepOneSchema.safeParse(getValues())
    const stepOneFields = [
      'address',
      'birthCertificateUrl',
      'name',
      'nidImageUrl',
      'passportImageUrl',
      'password',
      'phone',
      'profilePhotoUrl',
    ]

    clearErrors(stepOneFields)

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (typeof fieldName === 'string') {
          setError(fieldName, {
            message: issue.message,
            type: 'manual',
          })
        }
      })
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
            Fee: Tk {paymentSettings.registrationFee}
          </span>
        </div>
        {!paymentSettings.registrationEnabled ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-800">
            New member registration is currently closed. Please contact the organization office for help.
          </div>
        ) : null}
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
        {paymentSettings.registrationEnabled ? (
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submitRegistration)}>
          {step === 1 ? (
            <>
              <Field error={errors.name?.message} label="নাম" {...register('name')} />
              <Field error={errors.phone?.message} label="ফোন" {...register('phone')} />
              <Field
                className="md:col-span-2"
                error={errors.address?.message}
                label="ঠিকানা"
                {...register('address')}
              />
              <Field
                error={errors.password?.message}
                label="পাসওয়ার্ড"
                type="password"
                {...register('password')}
              />
              <div className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    error={errors.profilePhotoUrl?.message}
                    label="প্রোফাইল ছবি URL"
                    {...register('profilePhotoUrl')}
                  />
                  <FileInput
                    disabled={Boolean(uploadingImageField)}
                    label={
                      uploadingImageField === 'profilePhotoUrl'
                        ? 'প্রোফাইল ছবি আপলোড হচ্ছে...'
                        : 'প্রোফাইল ছবি আপলোড'
                    }
                    onChange={(file) => uploadRegistrationImage('profilePhotoUrl', file)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    error={errors.nidImageUrl?.message}
                    label="এনআইডি / পরিচয়পত্র URL"
                    {...register('nidImageUrl')}
                  />
                  <FileInput
                    disabled={Boolean(uploadingImageField)}
                    label={
                      uploadingImageField === 'nidImageUrl'
                        ? 'পরিচয়পত্র আপলোড হচ্ছে...'
                        : 'এনআইডি / পরিচয়পত্র আপলোড'
                    }
                    onChange={(file) => uploadRegistrationImage('nidImageUrl', file)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    error={errors.passportImageUrl?.message}
                    label="পাসপোর্ট URL"
                    {...register('passportImageUrl')}
                  />
                  <FileInput
                    disabled={Boolean(uploadingImageField)}
                    label={
                      uploadingImageField === 'passportImageUrl'
                        ? 'পাসপোর্ট আপলোড হচ্ছে...'
                        : 'পাসপোর্ট আপলোড'
                    }
                    onChange={(file) => uploadRegistrationImage('passportImageUrl', file)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    error={errors.birthCertificateUrl?.message}
                    label="জন্ম সনদ URL"
                    {...register('birthCertificateUrl')}
                  />
                  <FileInput
                    disabled={Boolean(uploadingImageField)}
                    label={
                      uploadingImageField === 'birthCertificateUrl'
                        ? 'জন্ম সনদ আপলোড হচ্ছে...'
                        : 'জন্ম সনদ আপলোড'
                    }
                    onChange={(file) => uploadRegistrationImage('birthCertificateUrl', file)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-indigo-700">Registration payment</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <PaymentInfo label="Amount" value={`Tk ${paymentSettings.registrationFee}`} />
                  <PaymentInfo
                    label="Send to"
                    value={paymentSettings.donationNumber || 'Admin has not set a number yet'}
                  />
                  <PaymentInfo
                    label="Method"
                    value={paymentSettings.donationProvider || 'bKash / Nagad'}
                  />
                </div>
                <p className="mt-3 text-sm text-indigo-800">
                  Send the registration fee to this number, then enter your transaction ID and sender phone below.
                </p>
              </div>
              <Field
                error={errors.paymentMethod?.message}
                label="পেমেন্ট মাধ্যম"
                placeholder={paymentSettings.donationProvider || 'bKash or Nagad'}
                {...register('paymentMethod')}
              />
              <Field
                error={errors.transactionId?.message}
                label="ট্রানজেকশন আইডি"
                {...register('transactionId')}
              />
              <Field
                error={errors.senderPhone?.message}
                label="প্রেরকের ফোন"
                {...register('senderPhone')}
              />
              <Field
                error={errors.paymentNote?.message}
                label="পেমেন্ট নোট"
                textarea
                {...register('paymentNote')}
              />
              <Field
                error={errors.proofImageUrl?.message}
                label="পেমেন্ট প্রমাণ URL"
                {...register('proofImageUrl')}
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
          {uploadingImageField ? (
            <p className="md:col-span-2 text-sm font-medium text-indigo-700">
              ডকুমেন্ট আপলোড হচ্ছে...
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
              <Button disabled={Boolean(uploadingImageField)} icon={Send} onClick={goNext}>
                পরবর্তী
              </Button>
            ) : (
              <Button icon={Send} loading={isSubmitting || uploadingProof} type="submit">
                নিবন্ধন জমা দিন
              </Button>
            )}
          </div>
        </form>
        ) : null}
      </Panel>
    </main>
  )
}

function FileInput({ disabled, label, onChange }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-gray-700">
      <span>{label}</span>
      <span className="relative">
        <Upload
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
        />
        <input
          accept="image/*"
          className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
          disabled={disabled}
          onChange={(event) => onChange(event.target.files?.[0])}
          type="file"
        />
      </span>
    </label>
  )
}

function PaymentInfo({ label, value }) {
  return (
    <div className="rounded-lg bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 break-words text-base font-bold text-gray-900">{value}</p>
    </div>
  )
}
