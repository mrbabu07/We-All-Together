import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import useAuth from '../hooks/useAuth'
import { getAccountStatusPath, getDashboardPath, isSafeReturnUrl } from '../utils/authState'

export default function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

    const result = await login(form)
    setSubmitting(false)

    if (!result.ok) {
      setMessage(result.message)
      toast.error(result.message)
      return
    }

    const params = new URLSearchParams(location.search)
    const stateReturnUrl = location.state?.from
      ? `${location.state.from.pathname}${location.state.from.search || ''}`
      : ''
    const returnUrl = params.get('returnUrl') || stateReturnUrl
    const canUseReturnUrl =
      isSafeReturnUrl(returnUrl) && (!returnUrl.startsWith('/admin') || result.user.role === 'admin')
    const target = getAccountStatusPath(result.user) || (canUseReturnUrl ? returnUrl : getDashboardPath(result.user))
    toast.success('লগইন সফল হয়েছে')
    navigate(target, { replace: true })
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl place-items-center px-4 py-10 sm:px-6">
      <Panel className="w-full max-w-md">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <LogIn aria-hidden="true" className="h-6 w-6" />
        </div>
        <h1 className="text-center text-2xl font-semibold tracking-tight text-gray-900">
          লগইন করুন
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          সদস্য বা অ্যাডমিন অ্যাকাউন্টে প্রবেশ করুন
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <Field
            label="ইমেইল বা ফোন নম্বর"
            name="identifier"
            onChange={handleChange}
            placeholder="admin@gmail.com"
            required
            value={form.identifier}
          />
          <Field
            label="পাসওয়ার্ড"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
          {message ? <p className="text-sm font-medium text-red-600">{message}</p> : null}
          <Button icon={LogIn} loading={submitting} type="submit">
            লগইন
          </Button>
        </form>
      </Panel>
    </main>
  )
}
