import { useEffect, useRef, useState } from 'react'
import { Download, IdCard, KeyRound, Save, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
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

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const cssVar = (name) =>
  window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export default function AccountPage() {
  const { refreshProfile, user } = useAuth()
  const canvasRef = useRef(null)
  const [profileForm, setProfileForm] = useState({
    address: '',
    birthCertificateUrl: '',
    emergencyContact: { name: '', phone: '', relation: '' },
    name: '',
    nidImageUrl: '',
    notificationPreferences: defaultPreferences,
    passportImageUrl: '',
    phone: '',
    profilePhotoUrl: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: '',
    currentPassword: '',
    newPassword: '',
  })
  const [activity, setActivity] = useState(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [message, setMessage] = useState('')
  const [uploadingField, setUploadingField] = useState('')

  useEffect(() => {
    if (user) {
      const timer = window.setTimeout(() => {
        setProfileForm({
          address: user.address || '',
          birthCertificateUrl: user.birthCertificateUrl || '',
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
      }, 0)

      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [user])

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const response = await api.get('/members/my-activity')
        setActivity(response.data.data)
      } catch {
        setActivity(null)
      }
    }

    loadActivity()
  }, [])

  const updateProfileField = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const updateEmergencyContact = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      emergencyContact: {
        ...current.emergencyContact,
        [field]: value,
      },
    }))
  }

  const updatePreference = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      notificationPreferences: {
        ...current.notificationPreferences,
        [field]: value,
      },
    }))
  }

  const updatePasswordField = (event) => {
    setPasswordForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.patch('/auth/me', profileForm)
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
      const response = await api.post('/uploads/profile-document', {
        image,
        name: `${field}-${Date.now()}`,
      })
      setProfileForm((current) => ({
        ...current,
        [field]: response.data.data.image.url,
      }))
      toast.success('ফাইল আপলোড হয়েছে')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setUploadingField('')
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('নতুন পাসওয়ার্ড এবং confirmation মিলছে না।')
      return
    }

    try {
      await api.patch('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({
        confirmPassword: '',
        currentPassword: '',
        newPassword: '',
      })
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
      const response = await api.get('/members/my-data')
      const printWindow = window.open('', '_blank', 'noopener,noreferrer')

      if (!printWindow) {
        toast.error('Popup অনুমতি দিন।')
        return
      }

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>My Data</title>
            <style>
              body { font-family: Arial, sans-serif; color: ${cssVar('--text-primary')}; padding: 32px; }
              h1 { color: ${cssVar('--brand-600')}; }
              pre { white-space: pre-wrap; border: 1px solid ${cssVar('--gray-200')}; border-radius: 12px; padding: 16px; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <h1>Dargah Para OIkko Porishod - My Data</h1>
            <p>Use browser print to save this page as PDF.</p>
            <pre>${escapeHtml(JSON.stringify(response.data.data, null, 2))}</pre>
            <button onclick="window.print()">Print / Save PDF</button>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const requestDelete = async () => {
    try {
      await api.post('/members/delete-request', { reason: deleteReason })
      setDeleteReason('')
      toast.success('Delete request admin এর কাছে পাঠানো হয়েছে')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const drawQrLikePattern = (context, text, x, y, size) => {
    const cells = 21
    const cellSize = size / cells
    let seed = 0

    for (let index = 0; index < text.length; index += 1) {
      seed += text.charCodeAt(index) * (index + 1)
    }

    context.fillStyle = cssVar('--text-primary')
    for (let row = 0; row < cells; row += 1) {
      for (let col = 0; col < cells; col += 1) {
        const finder =
          (row < 7 && col < 7) ||
          (row < 7 && col > cells - 8) ||
          (row > cells - 8 && col < 7)
        const value = (row * 31 + col * 17 + seed) % 5

        if (finder || value === 0 || value === 3) {
          context.fillRect(x + col * cellSize, y + row * cellSize, cellSize - 1, cellSize - 1)
        }
      }
    }
  }

  const downloadIdCard = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    canvas.width = 880
    canvas.height = 540
    context.fillStyle = cssVar('--text-inverted')
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = cssVar('--brand-600')
    context.fillRect(0, 0, canvas.width, 120)
    context.fillStyle = cssVar('--text-inverted')
    context.font = 'bold 34px Arial'
    context.fillText('Dargah Para OIkko Porishod', 40, 62)
    context.font = '18px Arial'
    context.fillText('Digital Member ID Card', 40, 94)
    context.fillStyle = cssVar('--brand-50')
    context.beginPath()
    context.arc(115, 240, 74, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = cssVar('--brand-600')
    context.font = 'bold 58px Arial'
    context.textAlign = 'center'
    context.fillText(user?.name?.slice(0, 1) || 'M', 115, 260)
    context.textAlign = 'left'
    context.fillStyle = cssVar('--text-primary')
    context.font = 'bold 30px Arial'
    context.fillText(user?.name || 'Member', 230, 205)
    context.font = '20px Arial'
    context.fillText(`Phone: ${user?.phone || ''}`, 230, 245)
    context.fillText(`Role: ${user?.role || 'member'}`, 230, 285)
    context.fillText(`Status: ${user?.status || 'approved'}`, 230, 325)
    context.fillStyle = cssVar('--text-secondary')
    context.font = '16px Arial'
    context.fillText(`Member ID: ${user?._id || ''}`, 40, 472)
    drawQrLikePattern(context, user?._id || user?.phone || 'member', 670, 180, 150)
    context.fillStyle = cssVar('--text-secondary')
    context.font = '14px Arial'
    context.fillText('Scan/verify with organization records', 610, 360)

    const link = document.createElement('a')
    link.download = `member-id-${user?.phone || 'card'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
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
          <Button icon={IdCard} onClick={downloadIdCard}>
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
          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={saveProfile}>
            <Field label="নাম" name="name" onChange={updateProfileField} required value={profileForm.name} />
            <Field
              label="ফোন"
              name="phone"
              onChange={updateProfileField}
              pattern="01[3-9][0-9]{8}"
              required
              value={profileForm.phone}
            />
            <Field
              className="md:col-span-2"
              label="ঠিকানা"
              name="address"
              onChange={updateProfileField}
              textarea
              value={profileForm.address}
            />
            <Field
              label="Emergency name"
              name="emergencyName"
              onChange={(event) => updateEmergencyContact('name', event.target.value)}
              value={profileForm.emergencyContact.name}
            />
            <Field
              label="Emergency phone"
              name="emergencyPhone"
              onChange={(event) => updateEmergencyContact('phone', event.target.value)}
              value={profileForm.emergencyContact.phone}
            />
            <Field
              label="Relation"
              name="relation"
              onChange={(event) => updateEmergencyContact('relation', event.target.value)}
              value={profileForm.emergencyContact.relation}
            />
            <DocumentUpload
              field="profilePhotoUrl"
              label="Profile Photo"
              onChange={updateProfileField}
              onUpload={uploadProfileDocument}
              uploading={uploadingField === 'profilePhotoUrl'}
              value={profileForm.profilePhotoUrl}
            />
            <DocumentUpload
              field="nidImageUrl"
              label="NID Image"
              onChange={updateProfileField}
              onUpload={uploadProfileDocument}
              uploading={uploadingField === 'nidImageUrl'}
              value={profileForm.nidImageUrl}
            />
            <DocumentUpload
              field="passportImageUrl"
              label="NID/Passport"
              onChange={updateProfileField}
              onUpload={uploadProfileDocument}
              uploading={uploadingField === 'passportImageUrl'}
              value={profileForm.passportImageUrl}
            />
            <DocumentUpload
              field="birthCertificateUrl"
              label="Birth Certificate"
              onChange={updateProfileField}
              onUpload={uploadProfileDocument}
              uploading={uploadingField === 'birthCertificateUrl'}
              value={profileForm.birthCertificateUrl}
            />
            <Button className="md:col-span-2" icon={Save} type="submit">
              প্রোফাইল সেভ
            </Button>
          </form>
        </Panel>

        <div className="grid gap-6">
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
                    checked={Boolean(profileForm.notificationPreferences[key])}
                    className="h-5 w-5 accent-indigo-600"
                    onChange={(event) => updatePreference(key, event.target.checked)}
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
          <form className="mt-4 grid gap-4" onSubmit={changePassword}>
            <Field
              label="বর্তমান পাসওয়ার্ড"
              name="currentPassword"
              onChange={updatePasswordField}
              required
              type="password"
              value={passwordForm.currentPassword}
            />
            <Field
              label="নতুন পাসওয়ার্ড"
              name="newPassword"
              onChange={updatePasswordField}
              required
              type="password"
              value={passwordForm.newPassword}
            />
            <Field
              error={
                passwordForm.confirmPassword &&
                passwordForm.newPassword !== passwordForm.confirmPassword
                  ? 'পাসওয়ার্ড মিলছে না'
                  : ''
              }
              label="Confirm password"
              name="confirmPassword"
              onChange={updatePasswordField}
              required
              type="password"
              value={passwordForm.confirmPassword}
            />
            <Button icon={KeyRound} type="submit">
              পাসওয়ার্ড পরিবর্তন
            </Button>
          </form>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Delete account request</h2>
          <p className="mt-2 text-sm text-gray-500">
            অ্যাডমিন approve না করা পর্যন্ত অ্যাকাউন্ট delete হবে না।
          </p>
          <Field
            className="mt-4"
            label="Reason"
            name="deleteReason"
            onChange={(event) => setDeleteReason(event.target.value)}
            textarea
            value={deleteReason}
          />
          <Button className="mt-4" icon={Trash2} onClick={requestDelete} variant="danger">
            Delete request পাঠান
          </Button>
        </Panel>
      </div>

      <canvas className="hidden" ref={canvasRef} />
    </main>
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

function DocumentUpload({ field, label, onChange, onUpload, uploading, value }) {
  return (
    <div className="grid gap-3 rounded-xl border border-gray-200 p-3">
      <Field label={`${label} URL`} name={field} onChange={onChange} value={value} />
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
