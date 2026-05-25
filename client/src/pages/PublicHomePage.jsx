import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartHandshake, LogIn, Send, UserPlus } from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import heroImage from '../assets/community-hero.png'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'

const initialDonationForm = {
  amount: '',
  donorName: '',
  method: '',
  note: '',
  phone: '',
  transactionId: '',
}

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

const formatDate = (value) => {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export default function PublicHomePage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [donationForm, setDonationForm] = useState(initialDonationForm)
  const [data, setData] = useState({
    activities: [],
    meetings: [],
    notices: [],
    rules: [],
    settings: {},
    tours: [],
  })

  const loadPublicData = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const [
        settingsResponse,
        noticesResponse,
        meetingsResponse,
        toursResponse,
        activitiesResponse,
        rulesResponse,
      ] =
        await Promise.all([
          api.get('/settings/public'),
          api.get('/notices/public'),
          api.get('/meetings/public'),
          api.get('/tours/public'),
          api.get('/activities/public'),
          api.get('/rules/public'),
        ])

      setData({
        activities: activitiesResponse.data.data.items,
        meetings: meetingsResponse.data.data.items,
        notices: noticesResponse.data.data.items,
        rules: rulesResponse.data.data.items,
        settings: settingsResponse.data.data.settings,
        tours: toursResponse.data.data.items,
      })
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPublicData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPublicData])

  const handleDonationChange = (event) => {
    setDonationForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const submitDonation = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post('/donations', donationForm)
      setDonationForm(initialDonationForm)
      setMessage('Donation submitted for admin verification. Thank you.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="bg-slate-50 text-slate-950">
      <section
        className="relative min-h-[68vh] overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.30)), url(${heroImage})`,
        }}
      >
        <div className="mx-auto flex min-h-[68vh] max-w-7xl items-center px-4 py-14 sm:px-6">
          <div className="max-w-2xl text-white">
            <p className="text-sm font-semibold uppercase text-emerald-100">
              Village unity and service
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Dargah Para OIkko Porishod
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-100">
              A shared system for registration, fees, notices, meetings, activities, rules, and
              transparent community finance.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                to="/register"
              >
                <UserPlus aria-hidden="true" className="h-4 w-4" />
                Register
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                to="/login"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-8">
          {message ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {message}
            </p>
          ) : null}

          {loading ? <p className="text-sm text-slate-600">Loading public updates...</p> : null}

          <PublicList items={data.notices} textKey="body" title="Public Notices" />
          <PublicList items={data.meetings} textKey="agenda" title="Public Meetings" />
          <PublicList items={data.tours} textKey="details" title="Public Tours" />
          <PublicList items={data.activities} textKey="description" title="Educational Activities" />
          <PublicList items={data.rules} textKey="description" title="Public Rules" />
        </div>

        <aside className="grid gap-6 self-start">
          <Panel>
            <HeartHandshake className="h-8 w-8 text-emerald-700" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">Donate</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {data.settings.donationProvider || 'Donation number'}:{' '}
              <span className="font-semibold text-slate-950">
                {data.settings.donationNumber || 'Not set yet'}
              </span>
            </p>
            <form className="mt-5 grid gap-4" onSubmit={submitDonation}>
              <Field
                label="Name"
                name="donorName"
                onChange={handleDonationChange}
                required
                value={donationForm.donorName}
              />
              <Field
                label="Phone"
                name="phone"
                onChange={handleDonationChange}
                required
                value={donationForm.phone}
              />
              <Field
                label="Amount"
                name="amount"
                onChange={handleDonationChange}
                required
                type="number"
                value={donationForm.amount}
              />
              <Field
                label="Method"
                name="method"
                onChange={handleDonationChange}
                placeholder="bKash or Nagad"
                required
                value={donationForm.method}
              />
              <Field
                label="Transaction ID"
                name="transactionId"
                onChange={handleDonationChange}
                required
                value={donationForm.transactionId}
              />
              <Field
                label="Note"
                name="note"
                onChange={handleDonationChange}
                textarea
                value={donationForm.note}
              />
              <Button icon={Send} type="submit">
                Submit Donation
              </Button>
            </form>
          </Panel>

          <Panel>
            <h2 className="text-xl font-bold text-slate-950">Registration Fee</h2>
            <p className="mt-3 text-3xl font-bold text-emerald-700">
              {money(data.settings.registrationFee)}
            </p>
            <Link
              className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              to="/register"
            >
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              Apply for Membership
            </Link>
          </Panel>
        </aside>
      </section>
    </main>
  )
}

function PublicList({ items, textKey, title }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.length === 0 ? (
          <p className="rounded-md bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            No items published yet.
          </p>
        ) : null}
        {items.map((item) => (
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={item._id}>
            {item.imageUrl ? (
              <img
                alt=""
                className="mb-4 h-40 w-full rounded-md object-cover"
                src={item.imageUrl}
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              {item.status ? <Badge value={item.status}>{item.status}</Badge> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item[textKey]}</p>
            {item.activityDate || item.meetingDate || item.startDate ? (
              <p className="mt-3 text-xs font-semibold uppercase text-emerald-700">
                {formatDate(item.activityDate || item.meetingDate || item.startDate)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
