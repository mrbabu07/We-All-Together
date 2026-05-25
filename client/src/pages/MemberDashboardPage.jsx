import { useCallback, useEffect, useMemo, useState } from 'react'
import {
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
} from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import SelectField from '../components/ui/SelectField'
import useAuth from '../hooks/useAuth'
import { readFileAsDataUrl } from '../utils/fileUtils'

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
  ['members', 'Members'],
]

export default function MemberDashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
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
    gallery: [],
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
        blogsResponse,
        galleryResponse,
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
      ])

      setData({
        activities: activitiesResponse.data.data.items,
        blogs: blogsResponse.data.data.blogs,
        gallery: galleryResponse.data.data.items,
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
      blogs: data.blogs.length,
      gallery: data.gallery.length,
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
          onProofUpload={uploadPaymentProof}
          onReceiptDownload={downloadPaymentReceipt}
          onReceipt={printPaymentReceipt}
          onSubmit={submitPayment}
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
        <Stat label="Blogs" value={stats.blogs} />
        <Stat label="Gallery Photos" value={stats.gallery} />
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

function CommunityImageUpload({ label, onUpload, uploading }) {
  return (
    <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
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
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={blog._id}>
            {blog.imageUrl ? (
              <img alt="" className="mb-4 h-48 w-full rounded-md object-cover" src={blog.imageUrl} />
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-950">{blog.title}</h3>
                  <Badge value={blog.audience}>{blog.audience}</Badge>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                  By {blog.createdBy?.name || 'Member'} | {formatDate(blog.createdAt)}
                </p>
              </div>
              {canManage(blog) ? (
                <Button icon={Trash2} onClick={() => onDelete(blog._id)} variant="danger">
                  Delete
                </Button>
              ) : null}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{blog.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button icon={Heart} onClick={() => onLike(blog._id)} variant="secondary">
                {hasLiked(blog) ? 'Liked' : 'Like'} ({blog.likes?.length || 0})
              </Button>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                {blog.comments?.length || 0} comments
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {(blog.comments || []).slice(-4).map((comment) => (
                <div className="rounded-md bg-slate-50 p-3" key={comment._id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-950">
                      {comment.user?.name || 'Member'}
                    </p>
                    {(user?.role === 'admin' ||
                      comment.user?._id === user?._id ||
                      blog.createdBy?._id === user?._id) ? (
                      <button
                        className="text-xs font-semibold text-rose-700 hover:text-rose-800"
                        onClick={() => onCommentDelete(blog._id, comment._id)}
                        type="button"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{comment.body}</p>
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
  const canManage = (item) =>
    user?.role === 'admin' || item.createdBy?._id === user?._id || item.createdBy === user?._id

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
          <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={item._id}>
            <img alt="" className="h-56 w-full object-cover" src={item.imageUrl} />
            <div className="grid gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-950">{item.title}</h3>
                <Badge value={item.audience}>{item.audience}</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-600">{item.description}</p>
              <p className="text-xs font-semibold uppercase text-slate-500">
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
    </div>
  )
}

function Payments({
  form,
  monthlyFee,
  onChange,
  onProofUpload,
  onReceipt,
  onReceiptDownload,
  onSubmit,
  payments,
  uploadingProof,
}) {
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
          <Field
            label="Payment Proof URL"
            name="proofImageUrl"
            onChange={(event) => onChange('proofImageUrl', event.target.value)}
            value={form.proofImageUrl}
          />
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>Upload Payment Proof</span>
            <input
              accept="image/*"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              disabled={uploadingProof}
              onChange={(event) => onProofUpload(event.target.files?.[0])}
              type="file"
            />
          </label>
          {uploadingProof ? (
            <p className="md:col-span-2 text-sm font-medium text-emerald-700">
              Uploading payment proof...
            </p>
          ) : null}
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
                {payment.proofImageUrl ? (
                  <a
                    className="mt-2 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
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
          <div className="flex gap-3 rounded-md border border-slate-200 p-4" key={member._id}>
            {member.profilePhotoUrl ? (
              <img
                alt=""
                className="h-12 w-12 rounded-md object-cover"
                src={member.profilePhotoUrl}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-sm font-bold text-emerald-800">
                {member.name?.slice(0, 1) || 'M'}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-950">{member.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{member.phone}</p>
              <p className="mt-1 text-sm text-slate-600">{member.address}</p>
            </div>
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
            {item.imageUrl ? (
              <img
                alt=""
                className="mb-3 h-36 w-full rounded-md object-cover"
                src={item.imageUrl}
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              {item.audience ? <Badge value={item.audience}>{item.audience}</Badge> : null}
              {item.status ? <Badge value={item.status}>{item.status}</Badge> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item[textKey] || item.location}</p>
            {item.minutes ? (
              <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                {item.minutes}
              </p>
            ) : null}
            {Array.isArray(item.attendance) && item.attendance.length ? (
              <p className="mt-3 text-xs font-semibold uppercase text-emerald-700">
                Attendance recorded: {item.attendance.length}
              </p>
            ) : null}
            {Array.isArray(item.participants) && item.participants.length ? (
              <p className="mt-3 text-xs font-semibold uppercase text-emerald-700">
                Participants: {item.participants.length} | Paid:{' '}
                {money(item.participants.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0))}
              </p>
            ) : null}
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
