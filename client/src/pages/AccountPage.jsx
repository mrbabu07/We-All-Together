import { useEffect, useState } from 'react'
import { KeyRound, Save, Upload } from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import useAuth from '../hooks/useAuth'
import { readFileAsDataUrl } from '../utils/fileUtils'

export default function AccountPage() {
  const { refreshProfile, user } = useAuth()
  const [profileForm, setProfileForm] = useState({
    address: '',
    birthCertificateUrl: '',
    name: '',
    nidImageUrl: '',
    phone: '',
    profilePhotoUrl: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  })
  const [message, setMessage] = useState('')
  const [uploadingField, setUploadingField] = useState('')

  useEffect(() => {
    if (user) {
      const timer = window.setTimeout(() => {
        setProfileForm({
          address: user.address || '',
          birthCertificateUrl: user.birthCertificateUrl || '',
          name: user.name || '',
          nidImageUrl: user.nidImageUrl || '',
          phone: user.phone || '',
          profilePhotoUrl: user.profilePhotoUrl || '',
        })
      }, 0)

      return () => window.clearTimeout(timer)
    }
  }, [user])

  const updateProfileField = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
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
      setMessage('Profile updated successfully.')
    } catch (error) {
      setMessage(getErrorMessage(error))
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
      setMessage('Image uploaded. Save profile to keep it on your account.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setUploadingField('')
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.patch('/auth/change-password', passwordForm)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
      })
      setMessage('Password changed successfully.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase text-indigo-700">Account</p>
        <h1 className="text-2xl font-bold text-gray-950">Profile and Password</h1>
        <p className="mt-1 text-sm text-gray-600">
          Keep your contact information and password up to date.
        </p>
      </div>

      {message ? (
        <p className="mt-5 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="text-lg font-bold text-gray-950">Profile</h2>
          <form className="mt-4 grid gap-4" onSubmit={saveProfile}>
            <Field
              label="Name"
              name="name"
              onChange={updateProfileField}
              required
              value={profileForm.name}
            />
            <Field
              label="Phone"
              name="phone"
              onChange={updateProfileField}
              required
              value={profileForm.phone}
            />
            <Field
              label="Address"
              name="address"
              onChange={updateProfileField}
              textarea
              value={profileForm.address}
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
              field="birthCertificateUrl"
              label="Birth Certificate"
              onChange={updateProfileField}
              onUpload={uploadProfileDocument}
              uploading={uploadingField === 'birthCertificateUrl'}
              value={profileForm.birthCertificateUrl}
            />
            <Button icon={Save} type="submit">
              Save Profile
            </Button>
          </form>
        </Panel>

        <Panel>
          <h2 className="text-lg font-bold text-gray-950">Password</h2>
          <form className="mt-4 grid gap-4" onSubmit={changePassword}>
            <Field
              label="Current Password"
              name="currentPassword"
              onChange={updatePasswordField}
              required
              type="password"
              value={passwordForm.currentPassword}
            />
            <Field
              label="New Password"
              name="newPassword"
              onChange={updatePasswordField}
              required
              type="password"
              value={passwordForm.newPassword}
            />
            <Button icon={KeyRound} type="submit">
              Change Password
            </Button>
          </form>
        </Panel>
      </div>
    </main>
  )
}

function DocumentUpload({ field, label, onChange, onUpload, uploading, value }) {
  return (
    <div className="grid gap-3 rounded-md border border-gray-200 p-3">
      <Field label={`${label} URL`} name={field} onChange={onChange} value={value} />
      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50">
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
