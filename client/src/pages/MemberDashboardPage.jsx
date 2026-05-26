import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Lightbox from 'yet-another-react-lightbox'
import DownloadPlugin from 'yet-another-react-lightbox/plugins/download'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  Heart,
  Image,
  MessageCircle,
  RefreshCw,
  Send,
  Trash2,
  Upload,
  Users,
  Vote,
} from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import SelectField from '../components/ui/SelectField'
import Skeleton from '../components/ui/Skeleton'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import { readFileAsDataUrl } from '../utils/fileUtils'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'

const initialPaymentForm = {
  method: '',
  month: new Date().toISOString().slice(0, 7),
  note: '',
  proofImageUrl: '',
  senderPhone: '',
  transactionId: '',
}

const initialBlogForm = {
  audience: 'public',
  body: '',
  imageUrl: '',
  title: '',
}

const initialGalleryForm = {
  audience: 'public',
  description: '',
  imageUrl: '',
  title: '',
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
const moneyPaisa = (value = 0) => `৳${(Number(value || 0) / 100).toLocaleString('bn-BD')}`
const monthLabel = ({ label, month, year }) =>
  label || `${['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'][Number(month || 1) - 1]} ${year}`

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const tabs = [
  ['overview', 'Overview'],
  ['payments', 'Payments'],
  ['blogs', 'Blogs'],
  ['gallery', 'Gallery'],
  ['updates', 'Updates'],
  ['polls', 'Polls'],
  ['members', 'Members'],
]

export default function MemberDashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab = tabs.some(([key]) => key === requestedTab) ? requestedTab : 'overview'
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm)
  const [blogForm, setBlogForm] = useState(initialBlogForm)
  const [galleryForm, setGalleryForm] = useState(initialGalleryForm)
  const [commentForms, setCommentForms] = useState({})
  const [uploadingProof, setUploadingProof] = useState(false)
  const [uploadingCommunityImage, setUploadingCommunityImage] = useState('')
  const [data, setData] = useState({
    activities: [],
    blogs: [],
    feeStatus: null,
    gallery: [],
    meetings: [],
    members: [],
    notices: [],
    payments: [],
    polls: [],
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
        blogsResponse,
        galleryResponse,
        pollsResponse,
        feeStatusResponse,
      ] = await Promise.all([
        api.get('/settings/public'),
        api.get('/payments/my'),
        api.get('/notices/members'),
        api.get('/meetings/members'),
        api.get('/tours/members'),
        api.get('/activities/members'),
        api.get('/rules/members'),
        api.get('/members'),
        api.get('/blogs/members'),
        api.get('/gallery/members'),
        api.get('/polls'),
        api.get('/fees/my-status'),
      ])

      setData({
        activities: activitiesResponse.data.data.items,
        blogs: blogsResponse.data.data.blogs,
        feeStatus: feeStatusResponse.data.data,
        gallery: galleryResponse.data.data.items,
        meetings: meetingsResponse.data.data.items,
        members: membersResponse.data.data.members,
        notices: noticesResponse.data.data.items,
        payments: paymentsResponse.data.data.payments,
        polls: pollsResponse.data.data.polls,
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

  const changeTab = (tab) => {
    setSearchParams(tab === 'overview' ? {} : { tab })
  }

  const stats = useMemo(() => {
    return {
      activities: data.activities.length,
      meetings: data.meetings.length,
      notices: data.notices.length,
      blogs: data.blogs.length,
      gallery: data.gallery.length,
      verifiedPayments: data.payments.filter((payment) => payment.status === 'verified').length,
    }
  }, [data])

  const submitPayment = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const feeStatus = data.feeStatus
      const months =
        feeStatus?.payableMonths?.length && feeStatus?.isOverdue
          ? feeStatus.payableMonths.map(({ month, year }) => ({ month, year }))
          : [
              {
                month: Number(paymentForm.month.slice(5, 7)),
                year: Number(paymentForm.month.slice(0, 4)),
              },
            ]

      await api.post('/fees/pay', {
        ...paymentForm,
        months,
      })
      setPaymentForm(initialPaymentForm)
      setMessage(
        months.length > 1
          ? 'Selected fee months submitted for admin verification.'
          : 'Monthly fee submitted for admin verification.',
      )
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const uploadPaymentProof = async (file) => {
    if (!file) {
      return
    }

    setUploadingProof(true)
    setMessage('')

    try {
      const image = await readFileAsDataUrl(file)
      const response = await api.post('/uploads/payment-proof', {
        image,
        name: `monthly-payment-${Date.now()}`,
      })
      setPaymentForm((current) => ({
        ...current,
        proofImageUrl: response.data.data.image.url,
      }))
      setMessage('Payment proof uploaded.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setUploadingProof(false)
    }
  }

  const uploadCommunityImage = async (target, file) => {
    if (!file) {
      return
    }

    setUploadingCommunityImage(target)
    setMessage('')

    try {
      const imageData = await readFileAsDataUrl(file)
      const response = await api.post('/uploads/profile-document', {
        image: imageData,
        name: `${target}-${Date.now()}`,
      })
      const imageUrl = response.data.data.image.url

      if (target === 'blog') {
        setBlogForm((current) => ({ ...current, imageUrl }))
      } else {
        setGalleryForm((current) => ({ ...current, imageUrl }))
      }

      setMessage('Image uploaded successfully.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setUploadingCommunityImage('')
    }
  }

  const submitBlog = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post('/blogs', blogForm)
      setBlogForm(initialBlogForm)
      setMessage('Blog published successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const submitGalleryItem = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post('/gallery', galleryForm)
      setGalleryForm(initialGalleryForm)
      setMessage('Gallery photo added successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const deleteBlog = async (id) => {
    try {
      await api.delete(`/blogs/${id}`)
      setMessage('Blog deleted successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const deleteGalleryItem = async (id) => {
    try {
      await api.delete(`/gallery/${id}`)
      setMessage('Gallery photo deleted successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const toggleBlogLike = async (id) => {
    try {
      await api.post(`/blogs/${id}/like`)
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const addBlogComment = async (id) => {
    const body = commentForms[id]

    if (!body?.trim()) {
      return
    }

    try {
      await api.post(`/blogs/${id}/comments`, { body })
      setCommentForms((current) => ({ ...current, [id]: '' }))
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const deleteBlogComment = async (blogId, commentId) => {
    try {
      await api.delete(`/blogs/${blogId}/comments/${commentId}`)
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const printPaymentReceipt = async (id) => {
    try {
      setMessage('')
      const response = await api.get(`/receipts/payments/${id}`)
      const receipt = response.data.data.receipt
      const printWindow = window.open('', '_blank', 'noopener,noreferrer')

      if (!printWindow) {
        setMessage('Allow popups to print the receipt.')
        return
      }

      const qrHtml = receipt.payment.qrCodeDataUrl
        ? `<div class="qr"><span class="label">Verification QR</span><img src="${receipt.payment.qrCodeDataUrl}" alt="" /><p>${escapeHtml(receipt.payment.verificationUrl || '')}</p></div>`
        : ''

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>${escapeHtml(receipt.receiptNo)}</title>
            <style>
              body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
              .receipt { border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px; max-width: 720px; margin: 0 auto; }
              h1 { margin: 0; font-size: 24px; }
              .muted { color: #64748b; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; }
              .item { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
              .label { display: block; color: #64748b; font-size: 12px; text-transform: uppercase; }
              .value { display: block; font-weight: 700; margin-top: 4px; }
              .qr { margin-top: 24px; }
              .qr img { display: block; height: 120px; margin-top: 8px; width: 120px; }
              .qr p { color: #64748b; font-size: 11px; overflow-wrap: anywhere; }
              @media print { button { display: none; } body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="receipt">
              <h1>${escapeHtml(receipt.organization.name)}</h1>
              <p class="muted">Receipt No: ${escapeHtml(receipt.receiptNo)} | Issued: ${escapeHtml(formatDate(receipt.issuedAt))}</p>
              <div class="grid">
                <div class="item"><span class="label">Member</span><span class="value">${escapeHtml(receipt.payment.user.name)}</span></div>
                <div class="item"><span class="label">Month</span><span class="value">${escapeHtml(receipt.payment.month)}</span></div>
                <div class="item"><span class="label">Amount</span><span class="value">${escapeHtml(money(receipt.payment.amount))}</span></div>
                <div class="item"><span class="label">Method</span><span class="value">${escapeHtml(receipt.payment.method)}</span></div>
                <div class="item"><span class="label">Transaction ID</span><span class="value">${escapeHtml(receipt.payment.transactionId)}</span></div>
                <div class="item"><span class="label">Status</span><span class="value">${escapeHtml(receipt.payment.status)}</span></div>
              </div>
              ${qrHtml}
              <p class="muted">This receipt was generated from the organization management system.</p>
              <button onclick="window.print()">Print</button>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const downloadPaymentReceipt = async (id) => {
    try {
      setMessage('')
      const response = await api.get(`/receipts/${id}`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `payment-receipt-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const votePoll = async (pollId, optionId) => {
    try {
      setMessage('')
      await api.post(`/polls/${pollId}/vote`, { optionId })
      setMessage('Vote submitted successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const submitRsvp = async (type, id, status) => {
    try {
      setMessage('')
      await api.post(`/${type}/${id}/rsvp`, { status })
      setMessage('RSVP updated successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">Member</p>
          <h1 className="text-2xl font-bold text-gray-950">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
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
            className={`min-h-11 rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === key
                ? 'bg-indigo-700 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            key={key}
            onClick={() => changeTab(key)}
            type="button"
          >
            {t[key] || label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
          {message}
        </p>
      ) : null}

      {!loading && data.feeStatus?.isOverdue ? (
        <OverdueAlertBanner feeStatus={data.feeStatus} onPay={() => changeTab('payments')} />
      ) : null}

      {loading ? (
        <Panel className="mt-6">
          <Skeleton rows={6} />
        </Panel>
      ) : null}

      {!loading && activeTab === 'overview' ? (
        <Overview
          data={data}
          monthlyFee={data.settings.monthlyFee}
          onPay={() => changeTab('payments')}
          stats={stats}
          user={user}
        />
      ) : null}
      {!loading && activeTab === 'payments' ? (
        <Payments
          form={paymentForm}
          monthlyFee={data.settings.monthlyFee}
          onChange={(field, value) =>
            setPaymentForm((current) => ({ ...current, [field]: value }))
          }
          onProofUpload={uploadPaymentProof}
          onReceiptDownload={downloadPaymentReceipt}
          onReceipt={printPaymentReceipt}
          onSubmit={submitPayment}
          paymentSettings={data.settings}
          feeStatus={data.feeStatus}
          payments={data.payments}
          uploadingProof={uploadingProof}
        />
      ) : null}
      {!loading && activeTab === 'blogs' ? (
        <Blogs
          commentForms={commentForms}
          form={blogForm}
          onChange={(field, value) => setBlogForm((current) => ({ ...current, [field]: value }))}
          onCommentChange={(id, value) =>
            setCommentForms((current) => ({ ...current, [id]: value }))
          }
          onCommentDelete={deleteBlogComment}
          onCommentSubmit={addBlogComment}
          onDelete={deleteBlog}
          onLike={toggleBlogLike}
          onSubmit={submitBlog}
          onUpload={uploadCommunityImage}
          uploading={uploadingCommunityImage === 'blog'}
          user={user}
          blogs={data.blogs}
        />
      ) : null}
      {!loading && activeTab === 'gallery' ? (
        <Gallery
          form={galleryForm}
          gallery={data.gallery}
          onChange={(field, value) =>
            setGalleryForm((current) => ({ ...current, [field]: value }))
          }
          onDelete={deleteGalleryItem}
          onSubmit={submitGalleryItem}
          onUpload={uploadCommunityImage}
          uploading={uploadingCommunityImage === 'gallery'}
          user={user}
        />
      ) : null}
      {!loading && activeTab === 'updates' ? (
        <Updates
          data={data}
          onMeetingRsvp={(id, status) => submitRsvp('meetings', id, status)}
          onTourRsvp={(id, status) => submitRsvp('tours', id, status)}
          user={user}
        />
      ) : null}
      {!loading && activeTab === 'polls' ? (
        <Polls polls={data.polls} onVote={votePoll} />
      ) : null}
      {!loading && activeTab === 'members' ? <MemberDirectory members={data.members} /> : null}
    </main>
  )
}

function Overview({ data, monthlyFee, onPay, stats, user }) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentPayment = data.payments.find((payment) => payment.month === currentMonth)
  const upcomingEvents = [...data.meetings, ...data.tours]
    .map((item) => ({
      ...item,
      eventDate: item.meetingDate || item.startDate,
      type: item.meetingDate ? 'মিটিং' : 'ভ্রমণ',
    }))
    .filter((item) => item.eventDate)
    .sort((left, right) => new Date(left.eventDate) - new Date(right.eventDate))
    .slice(0, 5)

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} src={user?.profilePhotoUrl} size="lg" />
            <div>
              <p className="text-sm font-semibold text-indigo-600">স্বাগতম</p>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                {user?.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{user?.phone}</p>
            </div>
          </div>
          <Badge value={user?.status || 'approved'}>{user?.status || 'approved'}</Badge>
        </div>
      </Panel>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">চলতি মাসের ফি</p>
            <h3 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              {money(monthlyFee)}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{currentMonth}</p>
          </div>
          <Badge value={currentPayment?.status === 'verified' ? 'verified' : 'pending'}>
            {currentPayment?.status === 'verified' ? 'পরিশোধিত' : 'অপরিশোধিত'}
          </Badge>
          {currentPayment?.status !== 'verified' ? (
            <Button icon={CreditCard} onClick={onPay}>
              ফি দিন
            </Button>
          ) : null}
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Monthly Fee" value={money(monthlyFee)} />
        <Stat label="Verified Payments" value={stats.verifiedPayments} />
        <Stat label="Private Notices" value={stats.notices} />
        <Stat label="Upcoming Meetings" value={stats.meetings} />
        <Stat label="Blogs" value={stats.blogs} />
        <Stat label="Gallery Photos" value={stats.gallery} />
      </div>
      <Panel>
        <SectionTitle icon={Bell} title="সাম্প্রতিক নোটিশ" />
        <div className="mt-4 grid gap-3">
          {data.notices.slice(0, 4).map((notice) => (
            <article className="rounded-xl border border-gray-200 bg-gray-50 p-4" key={notice._id}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                <Badge value={notice.audience}>{notice.audience}</Badge>
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">
                {notice.body}
              </p>
            </article>
          ))}
          {data.notices.length === 0 ? <Empty text="No notices yet." /> : null}
        </div>
      </Panel>
      <Panel>
        <SectionTitle icon={CalendarDays} title="আসন্ন ইভেন্ট" />
        <div className="mt-5 grid gap-4">
          {upcomingEvents.length === 0 ? <Empty text="No upcoming events." /> : null}
          {upcomingEvents.map((item) => (
            <div className="grid grid-cols-[auto_1fr] gap-4" key={`${item.type}-${item._id}`}>
              <div className="flex flex-col items-center">
                <span className="h-3 w-3 rounded-full bg-indigo-600" />
                <span className="h-full min-h-12 w-px bg-gray-200" />
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge value="planned">{item.type}</Badge>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {formatDate(item.eventDate)}
                  </p>
                </div>
                <h3 className="mt-2 font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {item.location || item.destination || item.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function CommunityImageUpload({ label, onUpload, uploading }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50">
      <Upload aria-hidden="true" className="h-4 w-4" />
      <span>{uploading ? 'Uploading...' : label}</span>
      <input
        accept="image/*"
        className="sr-only"
        disabled={uploading}
        onChange={(event) => onUpload(event.target.files?.[0])}
        type="file"
      />
    </label>
  )
}

function OverdueAlertBanner({ feeStatus, onPay }) {
  const overdueMonths = feeStatus.overdueMonths || []

  if (!overdueMonths.length) {
    return null
  }

  return (
    <section className="fee-alert-pulse mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-base font-bold text-red-800">
              আপনার {overdueMonths.length} মাসের বকেয়া ফি রয়েছে। মোট পরিশোধযোগ্য:{' '}
              {moneyPaisa(feeStatus.totalDuePaisa)}
            </p>
            <p className="mt-2 text-sm leading-7 text-red-700">
              {overdueMonths
                .map((item) => `${monthLabel(item)} — ${moneyPaisa(item.amountPaisa)}`)
                .join(', ')}
            </p>
          </div>
        </div>
        <Button className="bg-red-600 hover:bg-red-700" icon={CreditCard} onClick={onPay}>
          এখনই পরিশোধ করুন
        </Button>
      </div>
    </section>
  )
}

function Blogs({
  blogs,
  commentForms,
  form,
  onChange,
  onCommentChange,
  onCommentDelete,
  onCommentSubmit,
  onDelete,
  onLike,
  onSubmit,
  onUpload,
  uploading,
  user,
}) {
  const canManage = (blog) =>
    user?.role === 'admin' || blog.createdBy?._id === user?._id || blog.createdBy === user?._id
  const hasLiked = (blog) =>
    blog.likes?.some((like) => (like.user?._id || like.user) === user?._id)

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={BookOpen} title="Write Blog" />
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field
            label="Title"
            name="title"
            onChange={(event) => onChange('title', event.target.value)}
            required
            value={form.title}
          />
          <SelectField
            label="Audience"
            name="audience"
            onChange={(event) => onChange('audience', event.target.value)}
            value={form.audience}
          >
            <option value="public">Public</option>
            <option value="members">Members</option>
          </SelectField>
          <Field
            className="md:col-span-2"
            label="Body"
            name="body"
            onChange={(event) => onChange('body', event.target.value)}
            required
            textarea
            value={form.body}
          />
          <Field
            label="Image URL"
            name="imageUrl"
            onChange={(event) => onChange('imageUrl', event.target.value)}
            value={form.imageUrl}
          />
          <div className="flex items-end">
            <CommunityImageUpload
              label="Upload Blog Image"
              onUpload={(file) => onUpload('blog', file)}
              uploading={uploading}
            />
          </div>
          <Button className="md:col-span-2" icon={Send} type="submit">
            Publish Blog
          </Button>
        </form>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        {blogs.length === 0 ? <Empty text="No blogs yet." /> : null}
        {blogs.map((blog) => (
          <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm" key={blog._id}>
            {blog.imageUrl ? (
              <img alt="" className="mb-4 h-48 w-full rounded-md object-cover" src={blog.imageUrl} />
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-950">{blog.title}</h3>
                  <Badge value={blog.audience}>{blog.audience}</Badge>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase text-gray-500">
                  By {blog.createdBy?.name || 'Member'} | {formatDate(blog.createdAt)}
                </p>
              </div>
              {canManage(blog) ? (
                <Button icon={Trash2} onClick={() => onDelete(blog._id)} variant="danger">
                  Delete
                </Button>
              ) : null}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600">{blog.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button icon={Heart} onClick={() => onLike(blog._id)} variant="secondary">
                {hasLiked(blog) ? 'Liked' : 'Like'} ({blog.likes?.length || 0})
              </Button>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600">
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                {blog.comments?.length || 0} comments
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {(blog.comments || []).slice(-4).map((comment) => (
                <div className="rounded-md bg-gray-50 p-3" key={comment._id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-950">
                      {comment.user?.name || 'Member'}
                    </p>
                    {(user?.role === 'admin' ||
                      comment.user?._id === user?._id ||
                      blog.createdBy?._id === user?._id) ? (
                      <button
                        className="inline-flex min-h-11 items-center rounded-md px-3 text-xs font-semibold text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => onCommentDelete(blog._id, comment._id)}
                        type="button"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{comment.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <Field
                label="Comment"
                name={`comment-${blog._id}`}
                onChange={(event) => onCommentChange(blog._id, event.target.value)}
                value={commentForms[blog._id] || ''}
              />
              <div className="flex items-end">
                <Button icon={MessageCircle} onClick={() => onCommentSubmit(blog._id)}>
                  Comment
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Gallery({ form, gallery, onChange, onDelete, onSubmit, onUpload, uploading, user }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const canManage = (item) =>
    user?.role === 'admin' || item.createdBy?._id === user?._id || item.createdBy === user?._id
  const slides = gallery.map((item) => ({
    description: item.description,
    src: item.imageUrl,
    title: item.title,
  }))

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={Image} title="Add Gallery Photo" />
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field
            label="Title"
            name="title"
            onChange={(event) => onChange('title', event.target.value)}
            required
            value={form.title}
          />
          <SelectField
            label="Audience"
            name="audience"
            onChange={(event) => onChange('audience', event.target.value)}
            value={form.audience}
          >
            <option value="public">Public</option>
            <option value="members">Members</option>
          </SelectField>
          <Field
            className="md:col-span-2"
            label="Description"
            name="description"
            onChange={(event) => onChange('description', event.target.value)}
            textarea
            value={form.description}
          />
          <Field
            label="Image URL"
            name="imageUrl"
            onChange={(event) => onChange('imageUrl', event.target.value)}
            required
            value={form.imageUrl}
          />
          <div className="flex items-end">
            <CommunityImageUpload
              label="Upload Gallery Image"
              onUpload={(file) => onUpload('gallery', file)}
              uploading={uploading}
            />
          </div>
          <Button className="md:col-span-2" icon={Image} type="submit">
            Add Photo
          </Button>
        </form>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gallery.length === 0 ? <Empty text="No gallery photos yet." /> : null}
        {gallery.map((item) => (
          <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" key={item._id}>
            <button
              className="block w-full overflow-hidden text-left"
              onClick={() => setLightboxIndex(gallery.findIndex((row) => row._id === item._id))}
              type="button"
            >
              <img
                alt={item.title}
                className="h-56 w-full object-cover transition duration-300 hover:scale-105"
                src={item.imageUrl}
              />
            </button>
            <div className="grid gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-gray-950">{item.title}</h3>
                <Badge value={item.audience}>{item.audience}</Badge>
              </div>
              <p className="text-sm leading-6 text-gray-600">{item.description}</p>
              <p className="text-xs font-semibold uppercase text-gray-500">
                By {item.createdBy?.name || 'Member'} | {formatDate(item.createdAt)}
              </p>
              {canManage(item) ? (
                <Button icon={Trash2} onClick={() => onDelete(item._id)} variant="danger">
                  Delete Photo
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <Lightbox
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        open={lightboxIndex >= 0}
        plugins={[Thumbnails, Zoom, DownloadPlugin]}
        slides={slides}
      />
    </div>
  )
}

function Payments({
  feeStatus,
  form,
  monthlyFee,
  onChange,
  onProofUpload,
  onReceipt,
  onReceiptDownload,
  onSubmit,
  paymentSettings,
  payments,
  uploadingProof,
}) {
  const overdueMonths = feeStatus?.overdueMonths || []
  const payableMonths =
    overdueMonths.length && feeStatus?.payableMonths?.length
      ? feeStatus.payableMonths
      : [
          {
            amountPaisa: Math.round(Number(monthlyFee || 0) * 100),
            label: form.month,
            month: Number(form.month.slice(5, 7)),
            year: Number(form.month.slice(0, 4)),
          },
        ]
  const lateFeePaisa = feeStatus?.lateFeePaisa || 0
  const totalPaisa =
    payableMonths.reduce((sum, item) => sum + Number(item.amountPaisa || 0), 0) + lateFeePaisa

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={CreditCard} title="Pay Monthly Fee" />
        <p className="mt-2 text-sm text-gray-600">Current amount: {money(monthlyFee)}</p>
        {overdueMonths.length ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-bold text-red-800">
              আপনার বকেয়া ফি পরিশোধ না করে শুধু চলতি মাসের ফি দেওয়া সম্ভব নয়।
            </p>
            <div className="mt-4 grid gap-2">
              {payableMonths.map((item) => (
                <label
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                  key={`${item.year}-${item.month}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <input checked disabled readOnly type="checkbox" />
                    {monthLabel(item)}
                  </span>
                  <span>{moneyPaisa(item.amountPaisa)}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-white p-4 text-sm">
              {payableMonths.map((item) => (
                <div className="flex justify-between gap-4 py-1" key={`line-${item.year}-${item.month}`}>
                  <span>{monthLabel(item)}</span>
                  <span className="font-bold">{moneyPaisa(item.amountPaisa)}</span>
                </div>
              ))}
              {lateFeePaisa ? (
                <div className="flex justify-between gap-4 border-t border-gray-100 py-1 text-red-700">
                  <span>বিলম্ব ফি</span>
                  <span className="font-bold">{moneyPaisa(lateFeePaisa)}</span>
                </div>
              ) : null}
              <div className="mt-2 flex justify-between gap-4 border-t border-gray-200 pt-2 text-base font-bold text-gray-950">
                <span>মোট</span>
                <span>{moneyPaisa(totalPaisa)}</span>
              </div>
            </div>
          </div>
        ) : null}
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm font-semibold text-indigo-700">Send monthly fee to</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <PaymentTargetInfo label="Amount" value={money(monthlyFee)} />
            <PaymentTargetInfo
              label="Number"
              value={paymentSettings?.donationNumber || 'Admin has not set a number yet'}
            />
            <PaymentTargetInfo
              label="Method"
              value={paymentSettings?.donationProvider || 'bKash / Nagad'}
            />
          </div>
          <p className="mt-3 text-sm text-indigo-800">
            Pay to this admin-set number first, then submit your transaction details for verification.
          </p>
        </div>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field
            label="Month"
            name="month"
            onChange={(event) => onChange('month', event.target.value)}
            required
            type="month"
            disabled={overdueMonths.length > 0}
            value={form.month}
          />
          <Field
            label="Payment Method"
            name="method"
            onChange={(event) => onChange('method', event.target.value)}
            placeholder={paymentSettings?.donationProvider || 'bKash or Nagad'}
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
          <Field
            label="Payment Proof URL"
            name="proofImageUrl"
            onChange={(event) => onChange('proofImageUrl', event.target.value)}
            value={form.proofImageUrl}
          />
          <label className="grid gap-1.5 text-sm font-medium text-gray-700">
            <span>Upload Payment Proof</span>
            <input
              accept="image/*"
              className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
              disabled={uploadingProof}
              onChange={(event) => onProofUpload(event.target.files?.[0])}
              type="file"
            />
          </label>
          {uploadingProof ? (
            <p className="md:col-span-2 text-sm font-medium text-indigo-700">
              Uploading payment proof...
            </p>
          ) : null}
          <Button className="md:col-span-2" icon={Send} type="submit">
            Submit Payment ({moneyPaisa(totalPaisa)})
          </Button>
        </form>
      </Panel>

      <Panel>
        <SectionTitle icon={CreditCard} title="Payment History" />
        <div className="mt-4 grid gap-3">
          {payments.length === 0 ? <Empty text="No payments submitted yet." /> : null}
          {payments.map((payment) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 p-4"
              key={payment._id}
            >
              <div>
                <h3 className="font-semibold text-gray-950">{payment.month}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {money(payment.amount)} | {payment.method} | TX: {payment.transactionId}
                </p>
                {payment.proofImageUrl ? (
                  <a
                    className="mt-2 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                    href={payment.proofImageUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View proof
                  </a>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={payment.status}>{payment.status}</Badge>
                {payment.status === 'verified' ? (
                  <>
                    <Button icon={FileText} onClick={() => onReceipt(payment._id)} variant="secondary">
                      Print
                    </Button>
                    <Button
                      icon={Download}
                      onClick={() => onReceiptDownload(payment._id)}
                      variant="secondary"
                    >
                      PDF
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function PaymentTargetInfo({ label, value }) {
  return (
    <div className="rounded-lg bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 break-words text-base font-bold text-gray-900">{value}</p>
    </div>
  )
}

function Updates({ data, onMeetingRsvp, onTourRsvp, user }) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <UpdateList items={data.notices} title="Notices" textKey="body" />
      <UpdateList
        items={data.meetings}
        onRsvp={onMeetingRsvp}
        rsvpEnabled
        textKey="agenda"
        title="Meetings"
        user={user}
      />
      <UpdateList
        items={data.tours}
        onRsvp={onTourRsvp}
        rsvpEnabled
        textKey="details"
        title="Tours"
        user={user}
      />
      <UpdateList items={data.activities} title="Activities" textKey="description" />
      <UpdateList items={data.rules} title="Rules" textKey="description" />
    </div>
  )
}

function Polls({ onVote, polls }) {
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      {polls.length === 0 ? <Empty text="No active polls yet." /> : null}
      {polls.map((poll) => (
        <Panel key={poll._id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionTitle icon={Vote} title="Meeting Poll" />
            <Badge value={poll.isClosed ? 'rejected' : 'approved'}>
              {poll.isClosed ? 'Closed' : 'Open'}
            </Badge>
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-950">{poll.question}</h3>
          <p className="mt-1 text-sm text-gray-600">
            {poll.meetingId?.title || 'Meeting'} | Deadline {formatDate(poll.deadline)}
          </p>
          <div className="mt-4 grid gap-3">
            {poll.options.map((option) => {
              const percent = poll.totalVotes
                ? Math.round((option.voteCount / poll.totalVotes) * 100)
                : 0
              const disabled = poll.isClosed || poll.hasVoted

              return (
                <div className="rounded-md border border-gray-200 p-3" key={option._id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-950">{option.text}</p>
                      <p className="text-sm text-gray-500">
                        {option.voteCount} votes | {percent}%
                      </p>
                    </div>
                    {option.hasMyVote ? <Badge value="approved">Your vote</Badge> : null}
                    {!disabled ? (
                      <Button icon={Vote} onClick={() => onVote(poll._id, option._id)}>
                        Vote
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-indigo-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      ))}
    </div>
  )
}

function MemberDirectory({ members }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const visibleMembers = normalizedQuery
    ? members.filter((member) =>
        [member.name, member.phone, member.address]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
      )
    : members

  return (
    <Panel className="mt-6">
      <SectionTitle icon={Users} title="Member Directory" />
      <Field
        className="mt-4"
        label="Search Members"
        name="memberSearch"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Name, phone, address"
        value={query}
      />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleMembers.length === 0 ? <Empty text="No matching members found." /> : null}
        {visibleMembers.map((member) => (
          <div className="flex gap-3 rounded-md border border-gray-200 p-4" key={member._id}>
            {member.profilePhotoUrl ? (
              <img
                alt=""
                className="h-12 w-12 rounded-md object-cover"
                src={member.profilePhotoUrl}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-indigo-50 text-sm font-bold text-indigo-800">
                {member.name?.slice(0, 1) || 'M'}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-950">{member.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{member.phone}</p>
              <p className="mt-1 text-sm text-gray-600">{member.address}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function UpdateList({ items, onRsvp, rsvpEnabled = false, textKey, title, user }) {
  return (
    <Panel>
      <SectionTitle icon={CalendarDays} title={title} />
      <div className="mt-4 grid gap-3">
        {items.length === 0 ? <Empty text={`No ${title.toLowerCase()} yet.`} /> : null}
        {items.map((item) => (
          <div className="rounded-md border border-gray-200 p-4" key={item._id}>
            {item.imageUrl ? (
              <img
                alt=""
                className="mb-3 h-36 w-full rounded-md object-cover"
                src={item.imageUrl}
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-950">{item.title}</h3>
              {item.audience ? <Badge value={item.audience}>{item.audience}</Badge> : null}
              {item.status ? <Badge value={item.status}>{item.status}</Badge> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">{item[textKey] || item.location}</p>
            {item.minutes ? (
              <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-600">
                {item.minutes}
              </p>
            ) : null}
            {Array.isArray(item.attendance) && item.attendance.length ? (
              <p className="mt-3 text-xs font-semibold uppercase text-indigo-700">
                Attendance recorded: {item.attendance.length}
              </p>
            ) : null}
            {Array.isArray(item.participants) && item.participants.length ? (
              <p className="mt-3 text-xs font-semibold uppercase text-indigo-700">
                Participants: {item.participants.length} | Paid:{' '}
                {money(item.participants.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0))}
              </p>
            ) : null}
            {rsvpEnabled ? (
              <RsvpActions item={item} onRsvp={onRsvp} user={user} />
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
  )
}

function RsvpActions({ item, onRsvp, user }) {
  const current = item.rsvp?.find(
    (row) => String(row.memberId?._id || row.memberId) === String(user?._id),
  )
  const counts = (item.rsvp || []).reduce(
    (summary, row) => ({
      ...summary,
      [row.status]: (summary[row.status] || 0) + 1,
    }),
    { going: 0, maybe: 0, not_going: 0 },
  )

  return (
    <div className="mt-4 rounded-md bg-gray-50 p-3">
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-gray-600">
        <span>Going: {counts.going}</span>
        <span>Maybe: {counts.maybe}</span>
        <span>Not going: {counts.not_going}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {['going', 'maybe', 'not_going'].map((status) => (
          <Button
            key={status}
            onClick={() => onRsvp(item._id, status)}
            variant={current?.status === status ? 'primary' : 'secondary'}
          >
            {status.replace('_', ' ')}
          </Button>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <Panel>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
    </Panel>
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

function Empty({ text }) {
  return <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">{text}</p>
}
