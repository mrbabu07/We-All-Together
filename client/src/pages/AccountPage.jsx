import { useEffect, useState } from 'react'
import { KeyRound, Save } from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import useAuth from '../hooks/useAuth'

export default function AccountPage() {
  const { refreshProfile, user } = useAuth()
  const [profileForm, setProfileForm] = useState({
    address: '',
    name: '',
    phone: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      const timer = window.setTimeout(() => {
        setProfileForm({
          address: user.address || '',
          name: user.name || '',
          phone: user.phone || '',
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
        <p className="text-sm font-semibold uppercase text-emerald-700">Account</p>
        <h1 className="text-2xl font-bold text-slate-950">Profile and Password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Keep your contact information and password up to date.
        </p>
      </div>

      {message ? (
        <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="text-lg font-bold text-slate-950">Profile</h2>
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
            <Button icon={Save} type="submit">
              Save Profile
            </Button>
          </form>
        </Panel>

        <Panel>
          <h2 className="text-lg font-bold text-slate-950">Password</h2>
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
