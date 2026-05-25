import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck, ExternalLink, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../api/http'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Panel from '../components/ui/Panel'
import Skeleton from '../components/ui/Skeleton'

const toReadableDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A')

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await api.get('/notifications/my')
      setNotifications(response.data.data.notifications)
      setUnreadCount(response.data.data.unreadCount)
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadNotifications()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadNotifications])

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      await loadNotifications()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/my/read-all')
      await loadNotifications()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">Alerts</p>
          <h1 className="text-2xl font-bold text-gray-950">Notifications</h1>
          <p className="mt-1 text-sm text-gray-600">{unreadCount} unread message(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={RefreshCw} onClick={loadNotifications} variant="secondary">
            Refresh
          </Button>
          <Button icon={CheckCheck} onClick={markAllRead}>
            Mark All Read
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {message}
        </p>
      ) : null}

      <Panel className="mt-6">
        {loading ? <Skeleton rows={4} /> : null}
        {!loading && notifications.length === 0 ? (
          <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
            No notifications yet.
          </p>
        ) : null}
        <div className="grid gap-3">
          {notifications.map((item) => (
            <div
              className="grid gap-3 rounded-md border border-gray-200 p-4 md:grid-cols-[1fr_auto]"
              key={item._id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Bell aria-hidden="true" className="h-4 w-4 text-indigo-700" />
                  <h2 className="font-semibold text-gray-950">{item.title}</h2>
                  <Badge value={item.readAt ? 'approved' : 'pending'}>
                    {item.readAt ? 'read' : 'unread'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-gray-600">{item.message}</p>
                <p className="mt-2 text-xs font-medium text-gray-500">
                  {toReadableDate(item.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {item.link ? (
                  <Button as={Link} icon={ExternalLink} to={item.link} variant="secondary">
                    Open
                  </Button>
                ) : null}
                {!item.readAt ? (
                  <Button icon={CheckCheck} onClick={() => markRead(item._id)}>
                    Mark Read
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </main>
  )
}
