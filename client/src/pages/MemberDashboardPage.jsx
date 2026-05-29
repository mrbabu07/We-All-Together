import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useSearchParams } from 'react-router-dom'
import Lightbox from 'yet-another-react-lightbox'
import DownloadPlugin from 'yet-another-react-lightbox/plugins/download'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import { z } from 'zod'
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
  Save,
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

const normalizeBangladeshPhone = (value = '') => {
  const phone = String(value).trim().replace(/[\s-]/g, '')

  if (phone.startsWith('+88')) {
    return phone.slice(3)
  }

  if (phone.startsWith('88') && phone.length === 13) {
    return phone.slice(2)
  }

  return phone
}

const bangladeshPhoneSchema = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform(normalizeBangladeshPhone)
    .refine((value) => /^01[3-9]\d{8}$/.test(value), `${label} must use Bangladeshi format like 017XXXXXXXX.`)

const paymentSchema = z.object({
  method: z.string().trim().min(1, 'Payment method is required.'),
  month: z.string().trim().regex(/^\d{4}-\d{2}$/, 'Month is required.'),
  note: z.string().trim().max(300, 'Note cannot exceed 300 characters.').optional(),
  proofImageUrl: z.string().trim().min(1, 'Payment proof is required.'),
  senderPhone: bangladeshPhoneSchema('Sender phone'),
  transactionId: z.string().trim().min(1, 'Transaction ID is required.'),
})

const initialBlogForm = {
  audience: 'public',
  body: '',
  imageUrl: '',
  moderationStatus: 'pending',
  title: '',
}

const blogSchema = z.object({
  audience: z.enum(['public', 'members']),
  body: z.string().trim().min(1, 'Body is required.'),
  imageUrl: z.string().trim().optional(),
  moderationStatus: z.enum(['draft', 'pending', 'approved', 'rejected']).optional(),
  title: z.string().trim().min(1, 'Title is required.'),
})

const initialGalleryForm = {
  album: 'General',
  audience: 'public',
  caption: '',
  description: '',
  imageUrl: '',
  title: '',
}

const gallerySchema = z.object({
  album: z.string().trim().min(1, 'Album is required.'),
  audience: z.enum(['public', 'members']),
  caption: z.string().trim().max(160, 'Caption cannot exceed 160 characters.').optional(),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters.').optional(),
  imageUrl: z.string().trim().min(1, 'Image URL is required.'),
  title: z.string().trim().min(1, 'Title is required.'),
})

const inlineCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment is required.').max(500, 'Comment cannot exceed 500 characters.'),
})

const meetingCheckInSchema = z.object({
  code: z.string().trim().min(1, 'Attendance code is required.'),
})

const tourFeedbackSchema = z.object({
  comment: z.string().trim().max(500, 'Comment cannot exceed 500 characters.').optional(),
  rating: z.enum(['1', '2', '3', '4', '5'], {
    message: 'Rating must be between 1 and 5.',
  }),
})

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

const cssVar = (name) =>
  window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const tabs = [
  ['overview', 'Overview'],
  ['payments', 'Payments'],
  ['blogs', 'Blogs'],
  ['gallery', 'Gallery'],
  ['updates', 'Updates'],
  ['polls', 'Polls'],
  ['members', 'Members'],
]

const pathTabs = {
  '/member/blogs': 'blogs',
  '/member/events': 'updates',
  '/member/fees': 'payments',
  '/member/gallery': 'gallery',
  '/member/members': 'members',
  '/member/notices': 'updates',
  '/member/polls': 'polls',
}

export default function MemberDashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const pathTab = pathTabs[location.pathname]
  const activeTab = tabs.some(([key]) => key === requestedTab) ? requestedTab : pathTab || 'overview'
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [editingBlogId, setEditingBlogId] = useState('')
  const [lastBlogAutoSaveAt, setLastBlogAutoSaveAt] = useState(null)
  const [commentForms, setCommentForms] = useState({})
  const [commentErrors, setCommentErrors] = useState({})
  const [noticeCommentForms, setNoticeCommentForms] = useState({})
  const [noticeCommentErrors, setNoticeCommentErrors] = useState({})
  const [meetingCheckInForms, setMeetingCheckInForms] = useState({})
  const [meetingCheckInErrors, setMeetingCheckInErrors] = useState({})
  const [tourFeedbackForms, setTourFeedbackForms] = useState({})
  const [tourFeedbackErrors, setTourFeedbackErrors] = useState({})
  const [uploadingProof, setUploadingProof] = useState(false)
  const [uploadingCommunityImage, setUploadingCommunityImage] = useState('')
  const {
    formState: { errors: galleryErrors, isSubmitting: isSubmittingGallery },
    handleSubmit: handleGallerySubmit,
    register: registerGallery,
    reset: resetGallery,
    setValue: setGalleryValue,
  } = useForm({
    defaultValues: initialGalleryForm,
    resolver: zodResolver(gallerySchema),
  })
  const {
    control: blogControl,
    formState: { errors: blogErrors, isSubmitting: isSubmittingBlog },
    handleSubmit: handleBlogSubmit,
    register: registerBlog,
    reset: resetBlog,
    setValue: setBlogValue,
  } = useForm({
    defaultValues: initialBlogForm,
    resolver: zodResolver(blogSchema),
  })
  const blogForm = useWatch({ control: blogControl }) || initialBlogForm
  const {
    control: paymentControl,
    formState: { errors: paymentErrors, isSubmitting: isSubmittingPayment },
    handleSubmit: handlePaymentSubmit,
    register: registerPayment,
    reset: resetPayment,
    setValue: setPaymentValue,
  } = useForm({
    defaultValues: initialPaymentForm,
    resolver: zodResolver(paymentSchema),
  })
  const paymentForm = useWatch({ control: paymentControl }) || initialPaymentForm
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
  const lastBlogAutoSaveKey = useRef('')

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

  useEffect(() => {
    if (activeTab !== 'blogs') {
      return undefined
    }

    const title = blogForm.title.trim()
    const body = blogForm.body.trim()
    if (!title || !body) {
      return undefined
    }

    const draftKey = JSON.stringify({
      audience: blogForm.audience,
      body,
      imageUrl: blogForm.imageUrl,
      title,
    })
    if (lastBlogAutoSaveKey.current === draftKey) {
      return undefined
    }

    const timer = window.setTimeout(async () => {
      try {
        const payload = {
          ...blogForm,
          moderationStatus: 'draft',
        }
        if (editingBlogId) {
          await api.patch(`/blogs/${editingBlogId}`, payload)
        } else {
          const response = await api.post('/blogs', payload)
          setEditingBlogId(response.data.data.blog._id)
        }
        lastBlogAutoSaveKey.current = draftKey
        setLastBlogAutoSaveAt(new Date())
        await loadDashboard()
      } catch {
        lastBlogAutoSaveKey.current = ''
      }
    }, 30000)

    return () => window.clearTimeout(timer)
  }, [activeTab, blogForm, editingBlogId, loadDashboard])

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

  const submitPayment = async (values) => {
    setMessage('')

    try {
      const feeStatus = data.feeStatus
      const months =
        feeStatus?.payableMonths?.length && feeStatus?.isOverdue
          ? feeStatus.payableMonths.map(({ month, year }) => ({ month, year }))
          : [
              {
                month: Number(values.month.slice(5, 7)),
                year: Number(values.month.slice(0, 4)),
              },
            ]

      await api.post('/fees/pay', {
        ...values,
        months,
      })
      resetPayment(initialPaymentForm)
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
      setPaymentValue('proofImageUrl', response.data.data.image.url, {
        shouldDirty: true,
        shouldValidate: true,
      })
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
        setBlogValue('imageUrl', imageUrl, {
          shouldDirty: true,
          shouldValidate: true,
        })
      } else {
        setGalleryValue('imageUrl', imageUrl, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }

      setMessage('Image uploaded successfully.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setUploadingCommunityImage('')
    }
  }

  const submitBlog = async (values, moderationStatus = 'pending') => {
    setMessage('')

    try {
      const payload = {
        ...values,
        moderationStatus,
      }

      if (editingBlogId) {
        await api.patch(`/blogs/${editingBlogId}`, payload)
      } else {
        await api.post('/blogs', payload)
      }
      resetBlog(initialBlogForm)
      setEditingBlogId('')
      lastBlogAutoSaveKey.current = ''
      setLastBlogAutoSaveAt(null)
      setMessage(
        moderationStatus === 'draft'
          ? 'Blog draft saved successfully.'
          : 'Blog submitted for approval.',
      )
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const saveBlogDraft = (event) =>
    handleBlogSubmit((values) => submitBlog(values, 'draft'))(event)

  const submitBlogForApproval = (event) =>
    handleBlogSubmit((values) => submitBlog(values, 'pending'))(event)

  const editBlog = (blog) => {
    setEditingBlogId(blog._id)
    lastBlogAutoSaveKey.current = JSON.stringify({
      audience: blog.audience || 'public',
      body: blog.body || '',
      imageUrl: blog.imageUrl || '',
      title: blog.title || '',
    })
    resetBlog({
      audience: blog.audience || 'public',
      body: blog.body || '',
      imageUrl: blog.imageUrl || '',
      moderationStatus: blog.moderationStatus || 'pending',
      title: blog.title || '',
    })
  }

  const cancelBlogEdit = () => {
    setEditingBlogId('')
    resetBlog(initialBlogForm)
    lastBlogAutoSaveKey.current = ''
    setLastBlogAutoSaveAt(null)
  }

  const submitGalleryItem = async (values) => {
    setMessage('')

    try {
      await api.post('/gallery', values)
      resetGallery(initialGalleryForm)
      setMessage('Gallery photo submitted for admin approval.')
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const submitGalleryUpload = (event) => handleGallerySubmit(submitGalleryItem)(event)

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
    const result = inlineCommentSchema.safeParse({ body: commentForms[id] || '' })

    if (!result.success) {
      setCommentErrors((current) => ({
        ...current,
        [id]: result.error.flatten().fieldErrors.body?.[0] || 'Comment is required.',
      }))
      return
    }

    try {
      await api.post(`/blogs/${id}/comments`, { body: result.data.body })
      setCommentForms((current) => ({ ...current, [id]: '' }))
      setCommentErrors((current) => ({ ...current, [id]: '' }))
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

  const markNoticeRead = async (id) => {
    try {
      setMessage('')
      await api.post(`/notices/${id}/read`)
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const reactToNotice = async (id, type) => {
    try {
      setMessage('')
      await api.post(`/notices/${id}/reactions`, { type })
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const addNoticeComment = async (id) => {
    const result = inlineCommentSchema.safeParse({ body: noticeCommentForms[id] || '' })

    if (!result.success) {
      setNoticeCommentErrors((current) => ({
        ...current,
        [id]: result.error.flatten().fieldErrors.body?.[0] || 'Comment is required.',
      }))
      return
    }

    try {
      setMessage('')
      await api.post(`/notices/${id}/comments`, { body: result.data.body })
      setNoticeCommentForms((current) => ({ ...current, [id]: '' }))
      setNoticeCommentErrors((current) => ({ ...current, [id]: '' }))
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
              body { font-family: Arial, sans-serif; color: ${cssVar('--text-primary')}; padding: 32px; }
              .receipt { border: 1px solid ${cssVar('--gray-200')}; border-radius: 8px; padding: 24px; max-width: 720px; margin: 0 auto; }
              h1 { margin: 0; font-size: 24px; }
              .muted { color: ${cssVar('--text-secondary')}; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px; }
              .item { border-bottom: 1px solid ${cssVar('--gray-200')}; padding-bottom: 8px; }
              .label { display: block; color: ${cssVar('--text-secondary')}; font-size: 12px; text-transform: uppercase; }
              .value { display: block; font-weight: 700; margin-top: 4px; }
              .qr { margin-top: 24px; }
              .qr img { display: block; height: 120px; margin-top: 8px; width: 120px; }
              .qr p { color: ${cssVar('--text-secondary')}; font-size: 11px; overflow-wrap: anywhere; }
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

  const updateMeetingCheckInCode = (id, value) => {
    setMeetingCheckInForms((current) => ({
      ...current,
      [id]: value,
    }))
    setMeetingCheckInErrors((current) => ({
      ...current,
      [id]: '',
    }))
  }

  const checkInMeeting = async (id) => {
    const meeting = data.meetings.find((item) => item._id === id)
    const attendanceMode = meeting?.attendanceMode?.method || 'manual'
    const needsCode = ['otp', 'qr'].includes(attendanceMode)
    const result = meetingCheckInSchema.safeParse({
      code: needsCode ? meetingCheckInForms[id] || '' : 'manual',
    })

    if (!result.success) {
      setMeetingCheckInErrors((current) => ({
        ...current,
        [id]: result.error.flatten().fieldErrors.code?.[0] || 'Attendance code is required.',
      }))
      return
    }

    try {
      setMessage('')
      await api.post(`/meetings/${id}/check-in`, {
        code: needsCode ? result.data.code : '',
      })
      setMeetingCheckInForms((current) => ({
        ...current,
        [id]: '',
      }))
      setMeetingCheckInErrors((current) => ({
        ...current,
        [id]: '',
      }))
      setMessage('Meeting attendance checked in successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const registerForTour = async (id) => {
    try {
      setMessage('')
      const response = await api.post(`/tours/${id}/register`)
      setMessage(
        response.data.data.waitlisted
          ? 'Tour is full. You were added to the waitlist.'
          : 'Tour registration saved successfully.',
      )
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const updateTourFeedback = (id, field, value) => {
    setTourFeedbackForms((current) => ({
      ...current,
      [id]: {
        rating: '5',
        comment: '',
        ...(current[id] || {}),
        [field]: value,
      },
    }))
    setTourFeedbackErrors((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [field]: '',
      },
    }))
  }

  const submitTourFeedback = async (id) => {
    const result = tourFeedbackSchema.safeParse(
      tourFeedbackForms[id] || { rating: '5', comment: '' },
    )

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors

      setTourFeedbackErrors((current) => ({
        ...current,
        [id]: {
          comment: fieldErrors.comment?.[0] || '',
          rating: fieldErrors.rating?.[0] || '',
        },
      }))
      return
    }

    try {
      setMessage('')

      await api.post(`/tours/${id}/feedback`, result.data)
      setTourFeedbackErrors((current) => ({
        ...current,
        [id]: {},
      }))
      setMessage('Tour feedback submitted successfully.')
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
          feeStatus={data.feeStatus}
          form={paymentForm}
          formErrors={paymentErrors}
          isSubmitting={isSubmittingPayment}
          monthlyFee={data.settings.monthlyFee}
          onProofUpload={uploadPaymentProof}
          onReceiptDownload={downloadPaymentReceipt}
          onReceipt={printPaymentReceipt}
          onSubmit={handlePaymentSubmit(submitPayment)}
          paymentSettings={data.settings}
          registerPayment={registerPayment}
          payments={data.payments}
          uploadingProof={uploadingProof}
        />
      ) : null}
      {!loading && activeTab === 'blogs' ? (
        <Blogs
          blogs={data.blogs}
          commentErrors={commentErrors}
          commentForms={commentForms}
          editingBlogId={editingBlogId}
          formErrors={blogErrors}
          isSubmitting={isSubmittingBlog}
          onCancelEdit={cancelBlogEdit}
          onCommentChange={(id, value) => {
            setCommentForms((current) => ({ ...current, [id]: value }))
            setCommentErrors((current) => ({ ...current, [id]: '' }))
          }}
          onCommentDelete={deleteBlogComment}
          onCommentSubmit={addBlogComment}
          onDelete={deleteBlog}
          onEdit={editBlog}
          onLike={toggleBlogLike}
          onSaveDraft={saveBlogDraft}
          onSubmit={submitBlogForApproval}
          onUpload={uploadCommunityImage}
          registerBlog={registerBlog}
          lastAutoSaveAt={lastBlogAutoSaveAt}
          uploading={uploadingCommunityImage === 'blog'}
          user={user}
        />
      ) : null}
      {!loading && activeTab === 'gallery' ? (
        <Gallery
          formErrors={galleryErrors}
          gallery={data.gallery}
          isSubmitting={isSubmittingGallery}
          onDelete={deleteGalleryItem}
          onSubmit={submitGalleryUpload}
          onUpload={uploadCommunityImage}
          registerGallery={registerGallery}
          uploading={uploadingCommunityImage === 'gallery'}
          user={user}
        />
      ) : null}
      {!loading && activeTab === 'updates' ? (
        <Updates
          data={data}
          meetingCheckInErrors={meetingCheckInErrors}
          meetingCheckInForms={meetingCheckInForms}
          onMeetingCheckIn={checkInMeeting}
          onMeetingCheckInChange={updateMeetingCheckInCode}
          onMeetingRsvp={(id, status) => submitRsvp('meetings', id, status)}
          onNoticeCommentChange={(id, value) => {
            setNoticeCommentForms((current) => ({ ...current, [id]: value }))
            setNoticeCommentErrors((current) => ({ ...current, [id]: '' }))
          }}
          onNoticeCommentSubmit={addNoticeComment}
          onNoticeRead={markNoticeRead}
          onNoticeReact={reactToNotice}
          onTourFeedbackChange={updateTourFeedback}
          onTourFeedbackSubmit={submitTourFeedback}
          onTourRegister={registerForTour}
          onTourRsvp={(id, status) => submitRsvp('tours', id, status)}
          noticeCommentErrors={noticeCommentErrors}
          noticeCommentForms={noticeCommentForms}
          tourFeedbackErrors={tourFeedbackErrors}
          tourFeedbackForms={tourFeedbackForms}
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
  commentErrors,
  commentForms,
  editingBlogId,
  formErrors,
  isSubmitting,
  lastAutoSaveAt,
  onCancelEdit,
  onCommentChange,
  onCommentDelete,
  onCommentSubmit,
  onDelete,
  onEdit,
  onLike,
  onSaveDraft,
  onSubmit,
  onUpload,
  registerBlog,
  uploading,
  user,
}) {
  const canManage = (blog) =>
    user?.role === 'admin' || blog.createdBy?._id === user?._id || blog.createdBy === user?._id
  const hasLiked = (blog) =>
    blog.likes?.some((like) => (like.user?._id || like.user) === user?._id)
  const approvedBlogs = blogs.filter((blog) => (blog.moderationStatus || 'approved') === 'approved')
  const myBlogs = blogs.filter((blog) => canManage(blog))

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={BookOpen} title={editingBlogId ? 'Edit Blog' : 'Write Blog'} />
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field
            error={formErrors.title?.message}
            label="Title"
            {...registerBlog('title')}
          />
          <SelectField
            error={formErrors.audience?.message}
            label="Audience"
            {...registerBlog('audience')}
          >
            <option value="public">Public</option>
            <option value="members">Members</option>
          </SelectField>
          <Field
            className="md:col-span-2"
            error={formErrors.body?.message}
            label="Body"
            textarea
            {...registerBlog('body')}
          />
          <Field
            error={formErrors.imageUrl?.message}
            label="Image URL"
            {...registerBlog('imageUrl')}
          />
          <div className="flex items-end">
            <CommunityImageUpload
              label="Upload Blog Image"
              onUpload={(file) => onUpload('blog', file)}
              uploading={uploading}
            />
          </div>
          <p className="md:col-span-2 text-sm font-semibold text-gray-500">
            {lastAutoSaveAt
              ? `Draft auto-saved ${formatDate(lastAutoSaveAt.toISOString())}`
              : 'Draft auto-saves after 30 seconds when title and body are filled.'}
          </p>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button icon={Save} loading={isSubmitting} onClick={onSaveDraft} variant="secondary">
              Save Draft
            </Button>
            <Button icon={Send} loading={isSubmitting} type="submit">
              Submit for Approval
            </Button>
            {editingBlogId ? (
              <Button onClick={onCancelEdit} variant="secondary">
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel>
        <SectionTitle icon={FileText} title="My Blogs" />
        <div className="mt-4 grid gap-3">
          {myBlogs.length === 0 ? <Empty text="No blogs submitted yet." /> : null}
          {myBlogs.map((blog) => (
            <div className="rounded-md border border-gray-200 bg-white p-4" key={blog._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-950">{blog.title}</h3>
                    <Badge value={blog.moderationStatus || 'approved'}>
                      {blog.moderationStatus || 'approved'}
                    </Badge>
                    <Badge value={blog.audience}>{blog.audience}</Badge>
                  </div>
                  <p className="mt-1 text-xs font-semibold uppercase text-gray-500">
                    {formatDate(blog.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => onEdit(blog)} size="sm" variant="secondary">
                    Edit
                  </Button>
                  <Button icon={Trash2} onClick={() => onDelete(blog._id)} size="sm" variant="danger">
                    Delete
                  </Button>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-gray-600">
                {blog.body}
              </p>
              {blog.moderationNote ? (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  Reason: {blog.moderationNote}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        {approvedBlogs.length === 0 ? <Empty text="No approved blogs yet." /> : null}
        {approvedBlogs.map((blog) => (
          <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm" key={blog._id}>
            {blog.imageUrl ? (
              <img alt="" className="mb-4 h-48 w-full rounded-md object-cover" src={blog.imageUrl} />
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-950">{blog.title}</h3>
                  <Badge value={blog.audience}>{blog.audience}</Badge>
                  <Badge value={blog.moderationStatus || 'approved'}>
                    {blog.moderationStatus || 'approved'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs font-semibold uppercase text-gray-500">
                  By {blog.createdBy?.name || 'Member'} | {formatDate(blog.createdAt)}
                </p>
              </div>
              {canManage(blog) ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => onEdit(blog)} variant="secondary">
                    Edit
                  </Button>
                  <Button icon={Trash2} onClick={() => onDelete(blog._id)} variant="danger">
                    Delete
                  </Button>
                </div>
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
                error={commentErrors[blog._id]}
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

function Gallery({
  formErrors,
  gallery,
  isSubmitting,
  onDelete,
  onSubmit,
  onUpload,
  registerGallery,
  uploading,
  user,
}) {
  const [activeAlbum, setActiveAlbum] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const canManage = (item) =>
    user?.role === 'admin' || item.createdBy?._id === user?._id || item.createdBy === user?._id
  const approvedGallery = gallery.filter(
    (item) => (item.moderationStatus || 'approved') === 'approved' && item.albumVisible !== false,
  )
  const myUploads = gallery.filter((item) => canManage(item))
  const albums = [...new Set(approvedGallery.map((item) => item.album || 'General'))].sort()
  const visibleGallery =
    activeAlbum === 'all'
      ? approvedGallery
      : approvedGallery.filter((item) => (item.album || 'General') === activeAlbum)
  const slides = visibleGallery.map((item) => ({
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
            error={formErrors.title?.message}
            label="Title"
            {...registerGallery('title')}
          />
          <Field
            error={formErrors.album?.message}
            label="Album"
            {...registerGallery('album')}
          />
          <SelectField
            error={formErrors.audience?.message}
            label="Audience"
            {...registerGallery('audience')}
          >
            <option value="public">Public</option>
            <option value="members">Members</option>
          </SelectField>
          <Field
            error={formErrors.caption?.message}
            label="Caption"
            {...registerGallery('caption')}
          />
          <Field
            className="md:col-span-2"
            error={formErrors.description?.message}
            label="Description"
            textarea
            {...registerGallery('description')}
          />
          <Field
            error={formErrors.imageUrl?.message}
            label="Image URL"
            {...registerGallery('imageUrl')}
          />
          <div className="flex items-end">
            <CommunityImageUpload
              label="Upload Gallery Image"
              onUpload={(file) => onUpload('gallery', file)}
              uploading={uploading}
            />
          </div>
          <Button className="md:col-span-2" icon={Image} loading={isSubmitting} type="submit">
            Submit Photo
          </Button>
        </form>
      </Panel>

      <Panel>
        <SectionTitle icon={Upload} title="My Uploads" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {myUploads.length === 0 ? <Empty text="No gallery uploads yet." /> : null}
          {myUploads.map((item) => (
            <article className="overflow-hidden rounded-md border border-gray-200 bg-white" key={item._id}>
              <img alt="" className="h-36 w-full object-cover" src={item.imageUrl} />
              <div className="grid gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-950">{item.title}</h3>
                  <Badge value={item.moderationStatus || 'approved'}>
                    {item.moderationStatus || 'approved'}
                  </Badge>
                  <Badge value={item.albumVisible === false ? 'rejected' : 'approved'}>
                    {item.album || 'General'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{item.caption || item.description}</p>
                {item.moderationNote ? (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    Reason: {item.moderationNote}
                  </p>
                ) : null}
                <Button icon={Trash2} onClick={() => onDelete(item._id)} size="sm" variant="danger">
                  Delete Photo
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setActiveAlbum('all')}
          size="sm"
          variant={activeAlbum === 'all' ? 'primary' : 'secondary'}
        >
          All Albums
        </Button>
        {albums.map((album) => (
          <Button
            key={album}
            onClick={() => setActiveAlbum(album)}
            size="sm"
            variant={activeAlbum === album ? 'primary' : 'secondary'}
          >
            {album}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleGallery.length === 0 ? <Empty text="No approved gallery photos yet." /> : null}
        {visibleGallery.map((item) => (
          <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" key={item._id}>
            <button
              className="block w-full overflow-hidden text-left"
              onClick={() => setLightboxIndex(visibleGallery.findIndex((row) => row._id === item._id))}
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
                <Badge value="approved">{item.album || 'General'}</Badge>
              </div>
              <p className="text-sm leading-6 text-gray-600">{item.caption || item.description}</p>
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
  formErrors,
  isSubmitting,
  monthlyFee,
  onProofUpload,
  onReceipt,
  onReceiptDownload,
  onSubmit,
  paymentSettings,
  payments,
  registerPayment,
  uploadingProof,
}) {
  const overdueMonths = feeStatus?.overdueMonths || []
  const selectedMonth = form.month || initialPaymentForm.month
  const payableMonths =
    overdueMonths.length && feeStatus?.payableMonths?.length
      ? feeStatus.payableMonths
      : [
          {
            amountPaisa: Math.round(Number(monthlyFee || 0) * 100),
            label: selectedMonth,
            month: Number(selectedMonth.slice(5, 7)),
            year: Number(selectedMonth.slice(0, 4)),
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
            error={formErrors.month?.message}
            label="Month"
            type="month"
            readOnly={overdueMonths.length > 0}
            {...registerPayment('month')}
          />
          <Field
            error={formErrors.method?.message}
            label="Payment Method"
            placeholder={paymentSettings?.donationProvider || 'bKash or Nagad'}
            {...registerPayment('method')}
          />
          <Field
            error={formErrors.transactionId?.message}
            label="Transaction ID"
            {...registerPayment('transactionId')}
          />
          <Field
            error={formErrors.senderPhone?.message}
            label="Sender Phone"
            {...registerPayment('senderPhone')}
          />
          <Field
            className="md:col-span-2"
            error={formErrors.note?.message}
            label="Note"
            textarea
            {...registerPayment('note')}
          />
          <Field
            error={formErrors.proofImageUrl?.message}
            label="Payment Proof URL"
            {...registerPayment('proofImageUrl')}
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
          <Button className="md:col-span-2" icon={Send} loading={isSubmitting} type="submit">
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

function Updates({
  data,
  meetingCheckInErrors,
  meetingCheckInForms,
  noticeCommentErrors,
  noticeCommentForms,
  onMeetingCheckIn,
  onMeetingCheckInChange,
  onMeetingRsvp,
  onNoticeCommentChange,
  onNoticeCommentSubmit,
  onNoticeRead,
  onNoticeReact,
  onTourFeedbackChange,
  onTourFeedbackSubmit,
  onTourRegister,
  onTourRsvp,
  tourFeedbackErrors,
  tourFeedbackForms,
  user,
}) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <UpdateList
        commentErrors={noticeCommentErrors}
        commentForms={noticeCommentForms}
        items={data.notices}
        noticeActions
        onCommentChange={onNoticeCommentChange}
        onCommentSubmit={onNoticeCommentSubmit}
        onNoticeRead={onNoticeRead}
        onNoticeReact={onNoticeReact}
        title="Notices"
        textKey="body"
        user={user}
      />
      <UpdateList
        checkInErrors={meetingCheckInErrors}
        checkInForms={meetingCheckInForms}
        items={data.meetings}
        meetingActions
        onCheckInChange={onMeetingCheckInChange}
        onCheckInSubmit={onMeetingCheckIn}
        onRsvp={onMeetingRsvp}
        rsvpEnabled
        textKey="agenda"
        title="Meetings"
        user={user}
      />
      <UpdateList
        items={data.tours}
        onTourFeedbackChange={onTourFeedbackChange}
        onTourFeedbackSubmit={onTourFeedbackSubmit}
        onTourRegister={onTourRegister}
        onRsvp={onTourRsvp}
        rsvpEnabled
        textKey="details"
        title="Tours"
        tourActions
        tourFeedbackErrors={tourFeedbackErrors}
        tourFeedbackForms={tourFeedbackForms}
        user={user}
      />
      <UpdateList items={data.activities} title="Activities" textKey="description" />
      <UpdateList items={data.rules} title="Rules" textKey="description" />
    </div>
  )
}

function Polls({ onVote, polls }) {
  const [nowMs, setNowMs] = useState(0)

  useEffect(() => {
    const updateClock = () => setNowMs(Date.now())

    updateClock()
    const timer = window.setInterval(updateClock, 60000)

    return () => window.clearInterval(timer)
  }, [])

  const getDeadlineText = (poll) => {
    if (poll.isClosed) {
      return poll.closedAt ? `Closed ${formatDate(poll.closedAt)}` : 'Closed'
    }
    if (!nowMs) {
      return `Open until ${formatDate(poll.deadline)}`
    }

    const diffMs = new Date(poll.deadline).getTime() - nowMs
    const hours = Math.max(Math.ceil(diffMs / 3600000), 0)

    if (hours >= 24) {
      return `${Math.ceil(hours / 24)} days left`
    }

    return `${hours} hours left`
  }

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
            {poll.meetingId?.title || 'Standalone poll'} | Deadline {formatDate(poll.deadline)}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase text-gray-500">
            {getDeadlineText(poll)}
          </p>
          <div className="mt-4 grid gap-3">
            {poll.options.map((option) => {
              const percent = poll.totalVotes
                ? Math.round((option.voteCount / poll.totalVotes) * 100)
                : 0
              const disabled = poll.isClosed || poll.hasVoted
              const showResults = poll.isClosed || poll.hasVoted

              return (
                <div className="rounded-md border border-gray-200 p-3" key={option._id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-950">{option.text}</p>
                      <p className="text-sm text-gray-500">
                        {showResults ? `${option.voteCount} votes | ${percent}%` : 'Vote to see results'}
                      </p>
                    </div>
                    {option.hasMyVote ? <Badge value="approved">Your vote</Badge> : null}
                    {!disabled ? (
                      <Button icon={Vote} onClick={() => onVote(poll._id, option._id)}>
                        Vote
                      </Button>
                    ) : null}
                  </div>
                  {showResults ? (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-indigo-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  ) : null}
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

function UpdateList({
  checkInErrors = {},
  checkInForms = {},
  commentErrors = {},
  commentForms = {},
  items,
  meetingActions = false,
  noticeActions = false,
  onCheckInChange,
  onCheckInSubmit,
  onCommentChange,
  onCommentSubmit,
  onNoticeRead,
  onNoticeReact,
  onRsvp,
  onTourFeedbackChange,
  onTourFeedbackSubmit,
  onTourRegister,
  rsvpEnabled = false,
  textKey,
  title,
  tourActions = false,
  tourFeedbackErrors = {},
  tourFeedbackForms = {},
  user,
}) {
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
            {item.minutes && (item.minutesStatus === 'published' || !item.minutesStatus) ? (
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
            {tourActions ? (
              <TourActions
                feedbackErrors={tourFeedbackErrors[item._id] || {}}
                feedbackForm={tourFeedbackForms[item._id] || { rating: '5', comment: '' }}
                item={item}
                onFeedbackChange={onTourFeedbackChange}
                onFeedbackSubmit={onTourFeedbackSubmit}
                onRegister={onTourRegister}
                user={user}
              />
            ) : null}
            {meetingActions ? (
              <MeetingActions
                checkInError={checkInErrors[item._id]}
                checkInValue={checkInForms[item._id] || ''}
                item={item}
                onCheckInChange={onCheckInChange}
                onCheckInSubmit={onCheckInSubmit}
                user={user}
              />
            ) : null}
            {noticeActions ? (
              <NoticeActions
                commentError={commentErrors[item._id]}
                commentValue={commentForms[item._id] || ''}
                item={item}
                onCommentChange={onCommentChange}
                onCommentSubmit={onCommentSubmit}
                onRead={onNoticeRead}
                onReact={onNoticeReact}
                user={user}
              />
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
  )
}

function TourActions({
  feedbackErrors = {},
  feedbackForm,
  item,
  onFeedbackChange,
  onFeedbackSubmit,
  onRegister,
  user,
}) {
  const myId = String(user?._id || '')
  const myParticipant = (item.participants || []).find(
    (row) => String(row.member?._id || row.member) === myId,
  )
  const myWaitlist = (item.waitlist || []).find(
    (row) => String(row.member?._id || row.member) === myId,
  )
  const myFeedback = (item.feedback || []).find(
    (row) => String(row.member?._id || row.member) === myId,
  )
  const activeParticipants = (item.participants || []).filter(
    (row) => row.status !== 'cancelled',
  )
  const capacity = Number(item.seatCapacity || 0)
  const openSeats = capacity > 0 ? Math.max(capacity - activeParticipants.length, 0) : 'Open'
  const totalExpense = (item.expenses || []).reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  )
  const perHeadCost = activeParticipants.length
    ? Math.ceil(totalExpense / activeParticipants.length)
    : Number(item.tourFee || 0)
  const canRegister = item.registrationOpen && !myParticipant && !myWaitlist

  return (
    <div className="mt-4 grid gap-3 rounded-md bg-gray-50 p-3">
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-gray-600">
        <span>Registration: {item.registrationOpen ? 'open' : 'closed'}</span>
        <span>Seats: {activeParticipants.length}/{capacity || 'unlimited'}</span>
        <span>Open: {openSeats}</span>
        <span>Fee: {money(item.tourFee || 0)}</span>
        <span>Per head cost: {money(perHeadCost)}</span>
        <span>Waitlist: {item.waitlist?.length || 0}</span>
      </div>
      {myParticipant ? (
        <Badge value={myParticipant.status || 'approved'}>
          My status: {myParticipant.status || 'registered'}
        </Badge>
      ) : null}
      {myWaitlist ? <Badge value="pending">I am on waitlist</Badge> : null}
      {canRegister ? (
        <Button onClick={() => onRegister(item._id)} size="sm">
          {capacity > 0 && openSeats === 0 ? 'Join Waitlist' : 'Register'}
        </Button>
      ) : null}
      {item.status === 'completed' ? (
        <div className="grid gap-3 rounded-md bg-white p-3">
          <p className="text-xs font-semibold uppercase text-gray-500">
            {myFeedback ? `My feedback: ${myFeedback.rating}/5` : 'Tour Feedback'}
          </p>
          <div className="grid gap-3 md:grid-cols-[140px_1fr_auto]">
            <SelectField
              error={feedbackErrors.rating}
              label="Rating"
              name={`tour-rating-${item._id}`}
              onChange={(event) => onFeedbackChange(item._id, 'rating', event.target.value)}
              value={feedbackForm.rating || '5'}
            >
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </SelectField>
            <Field
              error={feedbackErrors.comment}
              label="Comment"
              name={`tour-comment-${item._id}`}
              onChange={(event) => onFeedbackChange(item._id, 'comment', event.target.value)}
              value={feedbackForm.comment || ''}
            />
            <div className="flex items-end">
              <Button onClick={() => onFeedbackSubmit(item._id)} size="sm" variant="secondary">
                Save Feedback
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MeetingActions({ checkInError, checkInValue, item, onCheckInChange, onCheckInSubmit, user }) {
  const myId = String(user?._id || '')
  const attendanceOpen = Boolean(item.attendanceMode?.active)
  const attendanceMode = item.attendanceMode?.method || 'manual'
  const needsCode = ['otp', 'qr'].includes(attendanceMode)
  const checkedIn = (item.attendance || []).some(
    (row) =>
      String(row.member?._id || row.member) === myId && row.status === 'present',
  )
  const myActions = (item.actionItems || []).filter(
    (action) => String(action.assignedTo?._id || action.assignedTo || '') === myId,
  )
  const agendaItems = [...(item.agendaItems || [])].sort(
    (left, right) => Number(left.order || 0) - Number(right.order || 0),
  )

  return (
    <div className="mt-4 grid gap-3 rounded-md bg-gray-50 p-3">
      {agendaItems.length ? (
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Agenda</p>
          <div className="mt-2 grid gap-2">
            {agendaItems.map((agenda, index) => (
              <div className="rounded-md bg-white px-3 py-2 text-sm text-gray-600" key={`${agenda.title}-${index}`}>
                <span className="font-semibold text-gray-950">{agenda.title}</span>
                {agenda.durationMinutes ? ` | ${agenda.durationMinutes} min` : ''}
                {agenda.details ? <p className="mt-1">{agenda.details}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {myActions.length ? (
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">My Action Items</p>
          <div className="mt-2 grid gap-2">
            {myActions.map((action, index) => (
              <div className="rounded-md bg-white px-3 py-2 text-sm text-gray-600" key={`${action.title}-${index}`}>
                <span className="font-semibold text-gray-950">{action.title}</span>
                {action.dueDate ? ` | Due ${formatDate(action.dueDate)}` : ''}
                {action.completed ? ' | Done' : ' | Open'}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {attendanceOpen ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-gray-600">
            <span>Attendance open</span>
            <span>Mode: {attendanceMode}</span>
            {checkedIn ? <Badge value="approved">Checked in</Badge> : null}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {needsCode ? (
              <Field
                className="min-w-48 flex-1"
                error={checkInError}
                label="Attendance Code"
                name={`attendance-code-${item._id}`}
                onChange={(event) => onCheckInChange(item._id, event.target.value)}
                value={checkInValue}
              />
            ) : null}
            <Button disabled={checkedIn} onClick={() => onCheckInSubmit(item._id)} size="sm">
              {checkedIn ? 'Checked In' : 'Check In'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function NoticeActions({
  commentError,
  commentValue,
  item,
  onCommentChange,
  onCommentSubmit,
  onRead,
  onReact,
  user,
}) {
  const myId = String(user?._id || '')
  const read = (item.readReceipts || []).some((row) => String(row.user?._id || row.user) === myId)
  const myReaction = (item.reactions || []).find((row) => String(row.user?._id || row.user) === myId)
  const reactions = (item.reactions || []).reduce(
    (summary, row) => ({
      ...summary,
      [row.type]: (summary[row.type] || 0) + 1,
    }),
    { like: 0, love: 0 },
  )

  return (
    <div className="mt-4 rounded-md bg-gray-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={read} onClick={() => onRead(item._id)} size="sm" variant="secondary">
          {read ? 'Read' : 'Mark read'}
        </Button>
        <Button
          onClick={() => onReact(item._id, 'like')}
          size="sm"
          variant={myReaction?.type === 'like' ? 'primary' : 'secondary'}
        >
          Like {reactions.like || 0}
        </Button>
        <Button
          onClick={() => onReact(item._id, 'love')}
          size="sm"
          variant={myReaction?.type === 'love' ? 'primary' : 'secondary'}
        >
          Love {reactions.love || 0}
        </Button>
        <span className="text-xs font-semibold uppercase text-gray-500">
          Reads {item.readReceipts?.length || 0}
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        {(item.comments || []).slice(-3).map((comment) => (
          <div className="rounded-md bg-white px-3 py-2 text-sm text-gray-600" key={comment._id || comment.createdAt}>
            <span className="font-semibold text-gray-900">
              {comment.user?.name || 'Member'}:
            </span>{' '}
            {comment.body}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <div className="min-w-64 flex-1">
            <input
              className="min-h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              onChange={(event) => onCommentChange(item._id, event.target.value)}
              placeholder="Ask a question"
              value={commentValue}
            />
            {commentError ? (
              <p className="mt-1 text-xs font-medium text-[var(--danger)]">{commentError}</p>
            ) : null}
          </div>
          <Button onClick={() => onCommentSubmit(item._id)} size="sm">
            Comment
          </Button>
        </div>
      </div>
    </div>
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
