import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CreditCard, RefreshCw, Send, Users } from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import useAuth from '../hooks/useAuth'

const initialPaymentForm = {
  method: '',
  month: new Date().toISOString().slice(0, 7),
  note: '',
  senderPhone: '',
  transactionId: '',
}

const formatDate = (value) => {
  if (!value) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: value.includes('T') ? 'short' : undefined,
  }).format(new Date(value))
}

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

const tabs = [
  ['overview', 'Overview'],
  ['payments', 'Payments'],
  ['updates', 'Updates'],
  ['members', 'Members'],
]

export default function MemberDashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm)
  const [data, setData] = useState({
    activities: [],
    meetings: [],
    members: [],
    notices: [],
    payments: [],
    rules: [],
    settings: {},
    tours: [],
  })

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const [
        settingsResponse,
        paymentsResponse,
        noticesResponse,
        meetingsResponse,
        toursResponse,
        activitiesResponse,
        rulesResponse,
        membersResponse,
      ] = await Promise.all([
        api.get('/settings/public'),
        api.get('/payments/my'),
        api.get('/notices/members'),
        api.get('/meetings/members'),
        api.get('/tours/members'),
        api.get('/activities/members'),
        api.get('/rules/members'),
        api.get('/members'),
      ])

      setData({
        activities: activitiesResponse.data.data.items,
        meetings: meetingsResponse.data.data.items,
        members: membersResponse.data.data.members,
        notices: noticesResponse.data.data.items,
        payments: paymentsResponse.data.data.payments,
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
      loadDashboard()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  const stats = useMemo(() => {
    return {
      activities: data.activities.length,
      meetings: data.meetings.length,
      notices: data.notices.length,
      verifiedPayments: data.payments.filter((payment) => payment.status === 'verified').length,
    }
  }, [data])

  const submitPayment = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post('/payments/monthly', paymentForm)
      setPaymentForm(initialPaymentForm)
      setMessage('Monthly fee submitted for admin verification.')
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Member</p>
          <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            {user?.name} | {user?.phone}
          </p>
        </div>
        <Button icon={RefreshCw} onClick={loadDashboard} variant="secondary">
          Refresh
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === key
                ? 'bg-emerald-700 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            key={key}
            onClick={() => setActiveTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </p>
      ) : null}

      {loading ? (
        <Panel className="mt-6">
          <p className="text-sm text-slate-600">Loading member dashboard...</p>
        </Panel>
      ) : null}

      {!loading && activeTab === 'overview' ? (
        <Overview data={data} monthlyFee={data.settings.monthlyFee} stats={stats} />
      ) : null}
      {!loading && activeTab === 'payments' ? (
        <Payments
          form={paymentForm}
          monthlyFee={data.settings.monthlyFee}
          onChange={(field, value) =>
            setPaymentForm((current) => ({ ...current, [field]: value }))
          }
          onSubmit={submitPayment}
          payments={data.payments}
        />
      ) : null}
      {!loading && activeTab === 'updates' ? <Updates data={data} /> : null}
      {!loading && activeTab === 'members' ? <MemberDirectory members={data.members} /> : null}
    </main>
  )
}

function Overview({ data, monthlyFee, stats }) {
  return (
    <div className="mt-6 grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Monthly Fee" value={money(monthlyFee)} />
        <Stat label="Verified Payments" value={stats.verifiedPayments} />
        <Stat label="Private Notices" value={stats.notices} />
        <Stat label="Upcoming Meetings" value={stats.meetings} />
      </div>
      <Panel>
        <SectionTitle icon={CalendarDays} title="Next Meeting" />
        {data.meetings[0] ? (
          <div className="mt-4 rounded-md border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">{data.meetings[0].title}</h3>
            <p className="mt-1 text-sm text-slate-600">{formatDate(data.meetings[0].meetingDate)}</p>
            <p className="mt-1 text-sm text-slate-600">{data.meetings[0].location}</p>
          </div>
        ) : (
          <Empty text="No meeting updates yet." />
        )}
      </Panel>
      <Panel>
        <SectionTitle icon={CalendarDays} title="Active Tours and Activities" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <MiniList items={data.tours.slice(0, 4)} title="Tours" />
          <MiniList items={data.activities.slice(0, 4)} title="Activities" />
        </div>
      </Panel>
    </div>
  )
}

function Payments({ form, monthlyFee, onChange, onSubmit, payments }) {
  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={CreditCard} title="Pay Monthly Fee" />
        <p className="mt-2 text-sm text-slate-600">Current amount: {money(monthlyFee)}</p>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field
            label="Month"
            name="month"
            onChange={(event) => onChange('month', event.target.value)}
            required
            type="month"
            value={form.month}
          />
          <Field
            label="Payment Method"
            name="method"
            onChange={(event) => onChange('method', event.target.value)}
            placeholder="bKash or Nagad"
            required
            value={form.method}
          />
          <Field
            label="Transaction ID"
            name="transactionId"
            onChange={(event) => onChange('transactionId', event.target.value)}
            required
            value={form.transactionId}
          />
          <Field
            label="Sender Phone"
            name="senderPhone"
            onChange={(event) => onChange('senderPhone', event.target.value)}
            required
            value={form.senderPhone}
          />
          <Field
            className="md:col-span-2"
            label="Note"
            name="note"
            onChange={(event) => onChange('note', event.target.value)}
            textarea
            value={form.note}
          />
          <Button className="md:col-span-2" icon={Send} type="submit">
            Submit Payment
          </Button>
        </form>
      </Panel>

      <Panel>
        <SectionTitle icon={CreditCard} title="Payment History" />
        <div className="mt-4 grid gap-3">
          {payments.length === 0 ? <Empty text="No payments submitted yet." /> : null}
          {payments.map((payment) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-4"
              key={payment._id}
            >
              <div>
                <h3 className="font-semibold text-slate-950">{payment.month}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {money(payment.amount)} | {payment.method} | TX: {payment.transactionId}
                </p>
              </div>
              <Badge value={payment.status}>{payment.status}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Updates({ data }) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <UpdateList items={data.notices} title="Notices" textKey="body" />
      <UpdateList items={data.meetings} title="Meetings" textKey="agenda" />
      <UpdateList items={data.tours} title="Tours" textKey="details" />
      <UpdateList items={data.activities} title="Activities" textKey="description" />
      <UpdateList items={data.rules} title="Rules" textKey="description" />
    </div>
  )
}

function MemberDirectory({ members }) {
  return (
    <Panel className="mt-6">
      <SectionTitle icon={Users} title="Member Directory" />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {members.length === 0 ? <Empty text="No approved members yet." /> : null}
        {members.map((member) => (
          <div className="rounded-md border border-slate-200 p-4" key={member._id}>
            <h3 className="font-semibold text-slate-950">{member.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{member.phone}</p>
            <p className="mt-1 text-sm text-slate-600">{member.address}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function UpdateList({ items, textKey, title }) {
  return (
    <Panel>
      <SectionTitle icon={CalendarDays} title={title} />
      <div className="mt-4 grid gap-3">
        {items.length === 0 ? <Empty text={`No ${title.toLowerCase()} yet.`} /> : null}
        {items.map((item) => (
          <div className="rounded-md border border-slate-200 p-4" key={item._id}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              {item.audience ? <Badge value={item.audience}>{item.audience}</Badge> : null}
              {item.status ? <Badge value={item.status}>{item.status}</Badge> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item[textKey] || item.location}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function MiniList({ items, title }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.length === 0 ? <Empty text={`No ${title.toLowerCase()} yet.`} /> : null}
        {items.map((item) => (
          <p className="text-sm text-slate-600" key={item._id}>
            {item.title}
          </p>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <Panel>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </Panel>
  )
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon aria-hidden="true" className="h-5 w-5 text-emerald-700" />
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
    </div>
  )
}

function Empty({ text }) {
  return <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">{text}</p>
}
