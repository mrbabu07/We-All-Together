import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CalendarDays, FileText, Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/http'
import useDebounce from '../../hooks/useDebounce'
import { hasAnyPermission, hasPermission, isStaffUser } from '../../utils/permissionUtils'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Field from '../ui/Field'
import Modal from '../ui/Modal'
import Skeleton from '../ui/Skeleton'

const groups = [
  { icon: Users, key: 'users', label: 'সদস্য' },
  { icon: FileText, key: 'notices', label: 'নোটিশ' },
  { icon: CalendarDays, key: 'meetings', label: 'মিটিং' },
  { icon: BookOpen, key: 'blogs', label: 'ব্লগ' },
]

const filterRows = (items, query, fields) => {
  const q = query.trim().toLowerCase()

  if (!q) {
    return []
  }

  return items
    .filter((item) =>
      fields
        .map((field) => item[field])
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
    .slice(0, 8)
}

export default function GlobalSearchModal({ onClose, open, user }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState({ blogs: [], meetings: [], notices: [], users: [] })
  const debouncedQuery = useDebounce(query, 300)
  const staffUser = isStaffUser(user)

  useEffect(() => {
    if (!open || !debouncedQuery.trim()) {
      const timer = window.setTimeout(() => {
        setResults({ blogs: [], meetings: [], notices: [], users: [] })
      }, 0)
      return () => window.clearTimeout(timer)
    }

    let active = true

    const search = async () => {
      setLoading(true)
      setMessage('')

      try {
        if (user?.role === 'admin') {
          const response = await api.get('/admin-controls/search', {
            params: { q: debouncedQuery },
          })
          if (active) {
            setResults(response.data.data)
          }
          return
        }

        if (staffUser) {
          const loadIfAllowed = async (allowed, request, fallback) => {
            if (!allowed) {
              return fallback
            }

            try {
              return await request()
            } catch {
              return fallback
            }
          }
          const [membersResponse, noticesResponse, meetingsResponse, blogsResponse] =
            await Promise.all([
              loadIfAllowed(hasPermission(user, 'member.view'), () => api.get('/admin/members/users'), {
                data: { data: { users: [] } },
              }),
              loadIfAllowed(hasPermission(user, 'notice.view'), () => api.get('/admin/notices/members'), {
                data: { data: { items: [] } },
              }),
              loadIfAllowed(hasPermission(user, 'meeting.view'), () => api.get('/admin/meetings/members'), {
                data: { data: { items: [] } },
              }),
              loadIfAllowed(hasAnyPermission(user, ['blog.view', 'blog.approve', 'blog.reject']), () => api.get('/admin/blogs/members'), {
                data: { data: { blogs: [] } },
              }),
            ])

          if (active) {
            setResults({
              blogs: filterRows(blogsResponse.data.data.blogs, debouncedQuery, ['title', 'body']),
              meetings: filterRows(meetingsResponse.data.data.items, debouncedQuery, [
                'title',
                'agenda',
                'location',
              ]),
              notices: filterRows(noticesResponse.data.data.items, debouncedQuery, [
                'title',
                'body',
                'category',
              ]),
              users: filterRows(membersResponse.data.data.users, debouncedQuery, [
                'name',
                'phone',
                'address',
              ]),
            })
          }
          return
        }

        const [membersResponse, noticesResponse, meetingsResponse, blogsResponse] =
          await Promise.all([
            api.get('/members'),
            api.get('/notices/members'),
            api.get('/meetings/members'),
            api.get('/blogs/members'),
          ])

        if (active) {
          setResults({
            blogs: filterRows(blogsResponse.data.data.blogs, debouncedQuery, ['title', 'body']),
            meetings: filterRows(meetingsResponse.data.data.items, debouncedQuery, [
              'title',
              'agenda',
              'location',
            ]),
            notices: filterRows(noticesResponse.data.data.items, debouncedQuery, [
              'title',
              'body',
              'category',
            ]),
            users: filterRows(membersResponse.data.data.members, debouncedQuery, [
              'name',
              'phone',
              'address',
            ]),
          })
        }
      } catch (error) {
        if (active) {
          setMessage(getErrorMessage(error))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    search()

    return () => {
      active = false
    }
  }, [debouncedQuery, open, staffUser, user])

  const totalResults = useMemo(
    () => Object.values(results).reduce((sum, rows) => sum + rows.length, 0),
    [results],
  )

  const openResult = (type) => {
    const adminRoutes = {
      blogs: '/admin/blogs',
      meetings: '/admin/meetings',
      notices: '/admin/notices',
      users: '/admin/members',
    }
    const memberRoutes = {
      blogs: '/member/blogs',
      meetings: '/member/events',
      notices: '/member/notices',
      users: '/member/members',
    }

    onClose()
    navigate(staffUser ? adminRoutes[type] : memberRoutes[type])
  }

  return (
    <Modal onClose={onClose} open={open} title="গ্লোবাল সার্চ">
      <Field
        label="খুঁজুন"
        name="globalSearch"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="সদস্য, নোটিশ, মিটিং, ব্লগ"
        value={query}
      />
      <p className="mt-2 text-xs text-gray-500">Ctrl+K চাপলে এই সার্চ খুলবে।</p>

      <div className="mt-5">
        {loading ? <Skeleton rows={3} /> : null}
        {message ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}
        {!loading && debouncedQuery.trim() && totalResults === 0 ? (
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">কোনো ফলাফল পাওয়া যায়নি।</p>
        ) : null}
        {!loading
          ? groups.map((group) => {
              const Icon = group.icon
              const rows = results[group.key] || []

              if (!rows.length) {
                return null
              }

              return (
                <section className="mt-4" key={group.key}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Icon aria-hidden="true" className="h-4 w-4 text-indigo-600" />
                    {group.label}
                    <Badge value="default">{rows.length}</Badge>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {rows.map((item) => (
                      <button
                        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-left transition hover:bg-gray-50"
                        key={item._id}
                        onClick={() => openResult(group.key)}
                        type="button"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-gray-900">
                            {item.name || item.title}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {item.phone || item.location || item.createdBy?.name || item.category || 'আপডেট'}
                          </span>
                        </span>
                        <Search aria-hidden="true" className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </section>
              )
            })
          : null}
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose} variant="secondary">
          বন্ধ করুন
        </Button>
      </div>
    </Modal>
  )
}
