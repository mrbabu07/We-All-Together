import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Download, IdCard, KeyRound, Save, Trash2, Upload } from 'lucide-react'
import QRCode from 'qrcode'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import api, { getErrorMessage } from '../api/http'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import useAuth from '../hooks/useAuth'
import { readFileAsDataUrl } from '../utils/fileUtils'

const defaultPreferences = {
  fees: true,
  meetings: true,
  notices: true,
  sms: true,
  tours: true,
  whatsapp: false,
}

const defaultProfileForm = {
  address: '',
  birthCertificateUrl: '',
  email: '',
  emergencyContact: { name: '', phone: '', relation: '' },
  name: '',
  nidImageUrl: '',
  notificationPreferences: { ...defaultPreferences },
  passportImageUrl: '',
  phone: '',
  profilePhotoUrl: '',
}

const defaultPasswordForm = {
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
}

const defaultDeleteForm = {
  reason: '',
}

const normalizeBangladeshPhone = (value = '') => {
  const phone = String(value).trim().replace(/[\s-]/g, '')

  if (phone.startsWith('+88')) {
    return phone.slice(3)
  }

  if (phone.startsWith('88') && phone.length === 13) {
    return phone.slice(2)
  }

  return phone
}

const bangladeshPhoneSchema = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform(normalizeBangladeshPhone)
    .refine((value) => /^01[3-9]\d{8}$/.test(value), `${label} must use Bangladeshi format like 017XXXXXXXX.`)

const optionalBangladeshPhoneSchema = (label) =>
  z
    .string()
    .trim()
    .transform(normalizeBangladeshPhone)
    .refine(
      (value) => value === '' || /^01[3-9]\d{8}$/.test(value),
      `${label} must use Bangladeshi format like 017XXXXXXXX.`,
    )

const optionalEmailSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Email must be valid.')

const optionalUrlSchema = z.string().trim().optional()

const profileSchema = z.object({
  address: z.string().trim().optional(),
  birthCertificateUrl: optionalUrlSchema,
  email: optionalEmailSchema,
  emergencyContact: z.object({
    name: z.string().trim().optional(),
    phone: optionalBangladeshPhoneSchema('Emergency phone'),
    relation: z.string().trim().optional(),
  }),
  name: z.string().trim().min(1, 'Name is required.'),
  nidImageUrl: optionalUrlSchema,
  notificationPreferences: z.object({
    fees: z.boolean(),
    meetings: z.boolean(),
    notices: z.boolean(),
    sms: z.boolean(),
    tours: z.boolean(),
    whatsapp: z.boolean(),
  }),
  passportImageUrl: optionalUrlSchema,
  phone: bangladeshPhoneSchema('Phone'),
  profilePhotoUrl: optionalUrlSchema,
})

const passwordSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
  })
  .superRefine((values, context) => {
    if (values.currentPassword === values.newPassword) {
      context.addIssue({
        code: 'custom',
        message: 'New password must be different from current password.',
        path: ['newPassword'],
      })
    }

    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: 'custom',
        message: 'পাসওয়ার্ড মিলছে না',
        path: ['confirmPassword'],
      })
    }
  })

const deleteRequestSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required.'),
})

const buildProfileDefaults = (user = {}) => ({
  address: user.address || '',
  birthCertificateUrl: user.birthCertificateUrl || '',
  email: user.email || '',
  emergencyContact: {
    name: user.emergencyContact?.name || '',
    phone: user.emergencyContact?.phone || '',
    relation: user.emergencyContact?.relation || '',
  },
  name: user.name || '',
  nidImageUrl: user.nidImageUrl || '',
  notificationPreferences: {
    ...defaultPreferences,
    ...user.notificationPreferences,
  },
  passportImageUrl: user.passportImageUrl || '',
  phone: user.phone || '',
  profilePhotoUrl: user.profilePhotoUrl || '',
})

const cssVar = (name) =>
  window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const loadCanvasImage = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })

export default function AccountPage() {
  const { refreshProfile, user } = useAuth()
  const canvasRef = useRef(null)
  const [activity, setActivity] = useState(null)
  const [idCardQrUrl, setIdCardQrUrl] = useState('')
  const [isGeneratingIdCard, setIsGeneratingIdCard] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadingField, setUploadingField] = useState('')
  const {
    control: profileControl,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
    handleSubmit: handleProfileSubmit,
    register: registerProfile,
    reset: resetProfile,
    setValue: setProfileValue,
  } = useForm({
    defaultValues: defaultProfileForm,
    resolver: zodResolver(profileSchema),
  })
  const profileForm = useWatch({ control: profileControl }) || defaultProfileForm
  const {
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
    handleSubmit: handlePasswordSubmit,
    register: registerPassword,
    reset: resetPassword,
  } = useForm({
    defaultValues: defaultPasswordForm,
    resolver: zodResolver(passwordSchema),
  })
  const {
    formState: { errors: deleteErrors, isSubmitting: isRequestingDelete },
    handleSubmit: handleDeleteSubmit,
    register: registerDelete,
    reset: resetDelete,
  } = useForm({
    defaultValues: defaultDeleteForm,
    resolver: zodResolver(deleteRequestSchema),
  })
  const verificationUrl = user?._id ? `${window.location.origin}/member/verify/${user._id}` : ''

  useEffect(() => {
    if (user) {
      const timer = window.setTimeout(() => {
        resetProfile(buildProfileDefaults(user))
      }, 0)

      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [resetProfile, user])

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const response = await api.get('/member/members/my-activity')
        setActivity(response.data.data)
      } catch {
        setActivity(null)
      }
    }

    loadActivity()
  }, [])

  useEffect(() => {
    let cancelled = false

    const generateQr = async () => {
      if (!verificationUrl) {
        setIdCardQrUrl('')
        return
      }

      try {
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
          color: {
            dark: '#222831',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 240,
        })

        if (!cancelled) {
          setIdCardQrUrl(qrDataUrl)
        }
      } catch {
        if (!cancelled) {
          setIdCardQrUrl('')
        }
      }
    }

    generateQr()

    return () => {
      cancelled = true
    }
  }, [verificationUrl])

  const saveProfile = async (values) => {
    setMessage('')

    try {
      await api.patch('/auth/me', values)
      await refreshProfile()
      setMessage('প্রোফাইল আপডেট হয়েছে।')
      toast.success('প্রোফাইল আপডেট হয়েছে')
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setMessage(errorMessage)
      toast.error(errorMessage)
    }
  }

  const uploadProfileDocument = async (field, file) => {
    if (!file) {
      return
    }

    setMessage('')
    setUploadingField(field)

    try {
      const image = await readFileAsDataUrl(file)
      const response = await api.post('/member/uploads/profile-document', {
        image,
        name: `${field}-${Date.now()}`,
      })
      setProfileValue(field, response.data.data.image.url, {
        shouldDirty: true,
        shouldValidate: true,
      })
      toast.success('ফাইল আপলোড হয়েছে')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setUploadingField('')
    }
  }

  const changePassword = async (values) => {
    setMessage('')

    try {
      await api.patch('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      resetPassword(defaultPasswordForm)
      setMessage('পাসওয়ার্ড পরিবর্তন হয়েছে।')
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে')
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setMessage(errorMessage)
      toast.error(errorMessage)
    }
  }

  const downloadMyData = async () => {
    try {
      const response = await api.get('/member/members/my-data.pdf', { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const safePhone = String(user?.phone || 'member').replace(/[^\w-]/g, '-')

      link.href = url
      link.download = `member-data-${safePhone}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('My data PDF downloaded.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const requestDelete = async (values) => {
    try {
      await api.post('/member/members/delete-request', values)
      resetDelete(defaultDeleteForm)
      toast.success('Delete request admin এর কাছে পাঠানো হয়েছে')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const emergencyContact = profileForm.emergencyContact || defaultProfileForm.emergencyContact
  const notificationPreferences = profileForm.notificationPreferences || defaultPreferences
  const completionItems = [
    profileForm.name,
    profileForm.phone,
    profileForm.email,
    profileForm.address,
    emergencyContact.phone,
    profileForm.profilePhotoUrl,
    profileForm.nidImageUrl || profileForm.passportImageUrl || profileForm.birthCertificateUrl,
  ]
  const profileCompletion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  )

  const downloadIdCard = async () => {
    if (!verificationUrl) {
      toast.error('Member verification link is not ready yet.')
      return
    }

    const canvas = canvasRef.current

    if (!canvas) {
      toast.error('ID card canvas is not ready yet.')
      return
    }

    setIsGeneratingIdCard(true)

    try {
      const qrDataUrl =
        idCardQrUrl ||
        (await QRCode.toDataURL(verificationUrl, {
          color: {
            dark: '#222831',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 240,
        }))
      const [profileImage, qrImage] = await Promise.all([
        loadCanvasImage(user?.profilePhotoUrl),
        loadCanvasImage(qrDataUrl),
      ])
      const context = canvas.getContext('2d')

      canvas.width = 880
      canvas.height = 540
      context.fillStyle = cssVar('--gray-100')
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = cssVar('--brand-900')
      context.fillRect(0, 0, canvas.width, 116)
      context.fillStyle = cssVar('--gray-700')
      context.fillRect(0, 116, canvas.width, 72)
      context.fillStyle = cssVar('--brand-600')
      context.fillRect(0, 188, canvas.width, 14)
      context.fillStyle = cssVar('--text-inverted')
      context.font = 'bold 34px Arial'
      context.fillText('Dargah Para OIkko Porishod', 40, 62)
      context.font = '18px Arial'
      context.fillText('Digital Member ID Card', 40, 94)
      context.fillStyle = cssVar('--text-inverted')
      context.font = 'bold 22px Arial'
      context.fillText(user?.status || 'approved', 704, 76)

      context.fillStyle = cssVar('--surface-0')
      context.fillRect(40, 226, 800, 248)

      context.save()
      context.fillStyle = cssVar('--brand-50')
      context.beginPath()
      context.arc(128, 330, 74, 0, Math.PI * 2)
      context.fill()
      context.clip()
      if (profileImage) {
        context.drawImage(profileImage, 54, 256, 148, 148)
      }
      context.restore()

      if (!profileImage) {
        context.fillStyle = cssVar('--brand-600')
        context.font = 'bold 58px Arial'
        context.textAlign = 'center'
        context.fillText(user?.name?.slice(0, 1) || 'M', 128, 350)
      }

      context.textAlign = 'left'
      context.fillStyle = cssVar('--text-primary')
      context.font = 'bold 30px Arial'
      context.fillText(user?.name || 'Member', 236, 300)
      context.font = '20px Arial'
      context.fillText(`Phone: ${user?.phone || ''}`, 236, 340)
      context.fillText(`Role: ${user?.role || 'member'}`, 236, 380)
      context.fillText(`Member ID: ${user?._id || ''}`, 236, 420)

      if (qrImage) {
        context.fillStyle = cssVar('--surface-0')
        context.fillRect(656, 246, 150, 150)
        context.drawImage(qrImage, 656, 246, 150, 150)
      }

      context.fillStyle = cssVar('--text-secondary')
      context.font = '14px Arial'
      context.fillText('Scan to verify membership', 648, 426)

      const link = document.createElement('a')
      link.download = `member-id-${user?.phone || 'card'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsGeneratingIdCard(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">Account</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            প্রোফাইল ও নিরাপত্তা
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            ব্যক্তিগত তথ্য, পাসওয়ার্ড, নোটিফিকেশন ও ডাটা কন্ট্রোল।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={Download} onClick={downloadMyData} variant="secondary">
            My data PDF
          </Button>
          <Button
            disabled={!verificationUrl}
            icon={IdCard}
            loading={isGeneratingIdCard}
            onClick={downloadIdCard}
          >
            ID card
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800">
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name} size="lg" src={user?.profilePhotoUrl} />
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.phone}</p>
              </div>
            </div>
            <Badge value={user?.status || 'approved'}>{user?.status || 'approved'}</Badge>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span>Profile completion</span>
              <span>{profileCompletion}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleProfileSubmit(saveProfile)}>
            <Field
              error={profileErrors.email?.message}
              label="Email"
              type="email"
              {...registerProfile('email')}
            />
            <Field error={profileErrors.name?.message} label="নাম" {...registerProfile('name')} />
            <Field
              error={profileErrors.phone?.message}
              label="ফোন"
              pattern="01[3-9][0-9]{8}"
              {...registerProfile('phone')}
            />
            <Field
              className="md:col-span-2"
              error={profileErrors.address?.message}
              label="ঠিকানা"
              textarea
              {...registerProfile('address')}
            />
            <Field
              error={profileErrors.emergencyContact?.name?.message}
              label="Emergency name"
              {...registerProfile('emergencyContact.name')}
            />
            <Field
              error={profileErrors.emergencyContact?.phone?.message}
              label="Emergency phone"
              {...registerProfile('emergencyContact.phone')}
            />
            <Field
              error={profileErrors.emergencyContact?.relation?.message}
              label="Relation"
              {...registerProfile('emergencyContact.relation')}
            />
            <DocumentUpload
              error={profileErrors.profilePhotoUrl?.message}
              field="profilePhotoUrl"
              label="Profile Photo"
              onUpload={uploadProfileDocument}
              registration={registerProfile('profilePhotoUrl')}
              uploading={uploadingField === 'profilePhotoUrl'}
              value={profileForm.profilePhotoUrl}
            />
            <DocumentUpload
              error={profileErrors.nidImageUrl?.message}
              field="nidImageUrl"
              label="NID Image"
              onUpload={uploadProfileDocument}
              registration={registerProfile('nidImageUrl')}
              uploading={uploadingField === 'nidImageUrl'}
              value={profileForm.nidImageUrl}
            />
            <DocumentUpload
              error={profileErrors.passportImageUrl?.message}
              field="passportImageUrl"
              label="NID/Passport"
              onUpload={uploadProfileDocument}
              registration={registerProfile('passportImageUrl')}
              uploading={uploadingField === 'passportImageUrl'}
              value={profileForm.passportImageUrl}
            />
            <DocumentUpload
              error={profileErrors.birthCertificateUrl?.message}
              field="birthCertificateUrl"
              label="Birth Certificate"
              onUpload={uploadProfileDocument}
              registration={registerProfile('birthCertificateUrl')}
              uploading={uploadingField === 'birthCertificateUrl'}
              value={profileForm.birthCertificateUrl}
            />
            <Button className="md:col-span-2" icon={Save} loading={isSavingProfile} type="submit">
              প্রোফাইল সেভ
            </Button>
          </form>
        </Panel>

        <div className="grid gap-6">
          <Panel>
            <DigitalIdPreview
              qrUrl={idCardQrUrl}
              user={user}
              verificationUrl={verificationUrl}
            />
            <Button
              className="mt-4 w-full"
              disabled={!verificationUrl}
              icon={IdCard}
              loading={isGeneratingIdCard}
              onClick={downloadIdCard}
              variant="secondary"
            >
              Download ID card
            </Button>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Activity summary</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat label="Paid months" value={activity?.paymentCount || 0} />
              <MiniStat label="Events" value={activity?.attendedCount || 0} />
              <MiniStat label="Blogs" value={activity?.blogCount || 0} />
              <MiniStat label="Donations" value={activity?.donationCount || 0} />
            </div>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              Notification preferences
            </h2>
            <div className="mt-4 grid gap-3">
              {Object.keys(defaultPreferences).map((key) => (
                <label
                  className="flex min-h-11 items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                  key={key}
                >
                  {key}
                  <input
                    {...registerProfile(`notificationPreferences.${key}`)}
                    checked={Boolean(notificationPreferences[key])}
                    className="h-5 w-5 accent-indigo-600"
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">পাসওয়ার্ড পরিবর্তন</h2>
          <form className="mt-4 grid gap-4" onSubmit={handlePasswordSubmit(changePassword)}>
            <Field
              error={passwordErrors.currentPassword?.message}
              label="বর্তমান পাসওয়ার্ড"
              type="password"
              {...registerPassword('currentPassword')}
            />
            <Field
              error={passwordErrors.newPassword?.message}
              label="নতুন পাসওয়ার্ড"
              type="password"
              {...registerPassword('newPassword')}
            />
            <Field
              error={passwordErrors.confirmPassword?.message}
              label="Confirm password"
              type="password"
              {...registerPassword('confirmPassword')}
            />
            <Button icon={KeyRound} loading={isChangingPassword} type="submit">
              পাসওয়ার্ড পরিবর্তন
            </Button>
          </form>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Delete account request</h2>
          <p className="mt-2 text-sm text-gray-500">
            অ্যাডমিন approve না করা পর্যন্ত অ্যাকাউন্ট delete হবে না।
          </p>
          <form className="mt-4 grid gap-4" onSubmit={handleDeleteSubmit(requestDelete)}>
            <Field
              error={deleteErrors.reason?.message}
              label="Reason"
              textarea
              {...registerDelete('reason')}
            />
            <Button icon={Trash2} loading={isRequestingDelete} type="submit" variant="danger">
              Delete request পাঠান
            </Button>
          </form>
        </Panel>
      </div>

      <canvas className="hidden" ref={canvasRef} />
    </main>
  )
}

function DigitalIdPreview({ qrUrl, user, verificationUrl }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">Digital ID card</h2>
        <Badge value={user?.status || 'approved'}>{user?.status || 'approved'}</Badge>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
        <div className="bg-gray-900 px-4 py-4 text-white">
          <p className="text-sm font-bold">Dargah Para OIkko Porishod</p>
          <p className="text-xs text-gray-200">Digital Member ID Card</p>
        </div>
        <div className="h-9 bg-gray-700" />
        <div className="h-2 bg-indigo-600" />
        <div className="grid gap-4 bg-white p-4">
          <div className="flex items-start gap-3">
            <Avatar name={user?.name} size="lg" src={user?.profilePhotoUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-gray-950">{user?.name || 'Member'}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">{user?.phone || 'No phone'}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-gray-500">
                {user?.role || 'member'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-gray-500">Member ID</p>
              <p className="mt-1 break-all text-xs font-semibold text-gray-800">
                {user?._id || 'Pending'}
              </p>
            </div>
            {qrUrl ? (
              <img
                alt="Member verification QR code"
                className="h-24 w-24 shrink-0 rounded-md border border-gray-200 bg-white p-1"
                src={qrUrl}
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
                QR
              </div>
            )}
          </div>
          <a
            className="break-all text-xs font-semibold text-indigo-700 hover:text-indigo-800"
            href={verificationUrl || '#'}
            rel="noreferrer"
            target="_blank"
          >
            {verificationUrl || 'Verification link pending'}
          </a>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
    </div>
  )
}

function DocumentUpload({ error, field, label, onUpload, registration, uploading, value }) {
  return (
    <div className="grid gap-3 rounded-xl border border-gray-200 p-3">
      <Field error={error} label={`${label} URL`} {...registration} />
      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50">
        <Upload aria-hidden="true" className="h-4 w-4" />
        <span>{uploading ? 'Uploading...' : `Upload ${label}`}</span>
        <input
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => onUpload(field, event.target.files?.[0])}
          type="file"
        />
      </label>
      {value ? (
        <a
          className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
          href={value}
          rel="noreferrer"
          target="_blank"
        >
          View uploaded file
        </a>
      ) : null}
    </div>
  )
}
