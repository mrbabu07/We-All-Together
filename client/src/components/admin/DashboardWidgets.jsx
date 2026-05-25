import { useCallback, useEffect, useMemo, useState } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import {
  Activity,
  CalendarClock,
  MapPin,
  Radio,
  TrendingUp,
  Trophy,
  Users,
  WalletCards,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api, { getErrorMessage } from '../../api/http'
import useSocket from '../../hooks/useSocket'
import Badge from '../ui/Badge'
import Panel from '../ui/Panel'
import Skeleton from '../ui/Skeleton'

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : 'N/A'

export default function DashboardWidgets() {
  const { online } = useSocket(true)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [data, setData] = useState(null)

  const loadWidgets = useCallback(async () => {
    try {
      setLoading(true)
      setMessage('')
      const response = await api.get('/admin-controls/widgets')
      setData(response.data.data)
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const firstLoad = window.setTimeout(loadWidgets, 0)
    const timer = window.setInterval(loadWidgets, 30000)

    return () => {
      window.clearTimeout(firstLoad)
      window.clearInterval(timer)
    }
  }, [loadWidgets])

  const feePercent = useMemo(() => {
    const total = data?.feeProgress?.total || 0
    const paid = data?.feeProgress?.paid || 0
    return total ? Math.round((paid / total) * 100) : 0
  }, [data])

  if (loading) {
    return (
      <Panel>
        <Skeleton rows={4} />
      </Panel>
    )
  }

  if (message) {
    return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{message}</p>
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle icon={Radio} title="লাইভ ড্যাশবোর্ড" />
          <Badge value="approved">{online.count || data?.online?.count || 0} online</Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <WidgetMetric
            icon={WalletCards}
            label="ফি সংগ্রহ"
            value={`${data?.feeProgress?.paid || 0}/${data?.feeProgress?.total || 0}`}
          >
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                style={{ width: `${feePercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-gray-500">{feePercent}% সম্পন্ন</p>
          </WidgetMetric>
          <WidgetMetric
            icon={TrendingUp}
            label="এই মাস বনাম গত মাস"
            value={money(data?.monthlyComparison?.currentIncome)}
          >
            <p className="mt-2 text-xs text-gray-500">
              গত মাস: {money(data?.monthlyComparison?.previousIncome)} | নতুন সদস্য:{' '}
              {data?.monthlyComparison?.newMembers || 0}
            </p>
          </WidgetMetric>
        </div>
        <div className="mt-6 h-64">
          <ResponsiveContainer height="100%" minHeight={0} minWidth={0} width="100%">
            <LineChart data={data?.memberGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="_id" stroke="#6B7280" />
              <YAxis allowDecimals={false} stroke="#6B7280" />
              <Tooltip />
              <Line
                animationDuration={900}
                dataKey="members"
                stroke="#4F46E5"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6">
        <Panel>
          <SectionTitle icon={Activity} title="সাম্প্রতিক কার্যক্রম" />
          <div className="mt-4 grid gap-3">
            {(data?.recentActivity || []).slice(0, 6).map((item) => (
              <div className="rounded-lg border border-gray-200 p-3" key={item._id}>
                <p className="text-sm font-semibold text-gray-900">{item.action}</p>
                <p className="text-xs text-gray-500">
                  {item.actor?.name || 'System'} | {formatDate(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle icon={CalendarClock} title="আগামী ইভেন্ট" />
          <div className="mt-4 grid gap-3">
            {(data?.upcomingEvents || []).map((item) => {
              const eventDate = item.meetingDate || item.startDate
              const days = differenceInCalendarDays(new Date(eventDate), new Date())

              return (
                <div className="rounded-lg bg-gray-50 p-3" key={item._id}>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(eventDate)} | {Math.max(days, 0)} দিন বাকি
                  </p>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionTitle icon={Trophy} title="শীর্ষ দাতা" />
        <div className="mt-4 grid gap-3">
          {(data?.topDonors || []).map((donor, index) => (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3" key={donor._id || index}>
              <span className="font-semibold text-gray-900">{donor._id || 'Anonymous'}</span>
              <span className="text-sm font-bold text-indigo-700">{money(donor.total)}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <SectionTitle icon={MapPin} title="এলাকা ভিত্তিক সদস্য" />
        <div className="mt-4 grid gap-2">
          {Object.entries(data?.addressBreakdown || {}).map(([area, count]) => (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3" key={area}>
              <span className="font-semibold text-gray-900">{area}</span>
              <Badge value="default">
                <Users aria-hidden="true" className="mr-1 h-3 w-3" />
                {count}
              </Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
    </div>
  )
}

function WidgetMetric({ children, icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <Icon aria-hidden="true" className="h-5 w-5 text-indigo-600" />
      <p className="mt-3 text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      {children}
    </div>
  )
}
