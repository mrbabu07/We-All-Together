import { useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import useAuth from '../hooks/useAuth'
import {
  canUseReturnUrlForUser,
  getAccountStatusPath,
  getDashboardPath,
} from '../utils/authState'

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'ইমেইল বা ফোন নম্বর দিন।'),
  password: z.string().min(1, 'পাসওয়ার্ড দিন।'),
})

export default function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm({
    defaultValues: { identifier: '', password: '' },
    resolver: zodResolver(loginSchema),
  })

  const submitLogin = async (values) => {
    const result = await login(values)

    if (!result.ok) {
      setError('root', { message: result.message })
      toast.error(result.message)
      return
    }

    const params = new URLSearchParams(location.search)
    const stateReturnUrl = location.state?.from
      ? `${location.state.from.pathname}${location.state.from.search || ''}`
      : ''
    const returnUrl = params.get('returnUrl') || stateReturnUrl
    const canUseReturnUrl = canUseReturnUrlForUser(returnUrl, result.user)
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
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit(submitLogin)}>
          <Field
            error={errors.identifier?.message}
            label="ইমেইল বা ফোন নম্বর"
            placeholder="admin@gmail.com"
            {...register('identifier')}
          />
          <Field
            error={errors.password?.message}
            label="পাসওয়ার্ড"
            type="password"
            {...register('password')}
          />
          {errors.root?.message ? (
            <p className="text-sm font-medium text-red-600">{errors.root.message}</p>
          ) : null}
          <Button icon={LogIn} loading={isSubmitting} type="submit">
            লগইন
          </Button>
        </form>
      </Panel>
    </main>
  )
}
