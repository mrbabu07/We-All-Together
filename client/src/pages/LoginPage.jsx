import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
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
      return
    }

    const target = result.user.role === 'admin' ? '/admin' : location.state?.from?.pathname || '/member'
    navigate(target, { replace: true })
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl place-items-center px-4 py-10 sm:px-6">
      <Panel className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-950">Login</h1>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <Field label="Phone" name="phone" onChange={handleChange} required value={form.phone} />
          <Field
            label="Password"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
          {message ? <p className="text-sm font-medium text-rose-700">{message}</p> : null}
          <Button disabled={submitting} icon={LogIn} type="submit">
            {submitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Panel>
    </main>
  )
}
