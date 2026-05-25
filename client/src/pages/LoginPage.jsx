import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({ phone: '', password: '' })
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

    const target = result.user.role === 'admin' ? '/admin' : location.state?.from?.pathname || '/member'
    toast.success('লগইন সফল হয়েছে')
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
        <p className="mt-2 text-center text-sm text-gray-500">সদস্য বা অ্যাডমিন অ্যাকাউন্টে প্রবেশ</p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <Field label="ফোন নম্বর" name="phone" onChange={handleChange} required value={form.phone} />
          <Field
            label="পাসওয়ার্ড"
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
