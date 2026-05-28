import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  DatabaseBackup,
  Download,
  DollarSign,
  Eye,
  FileDown,
  FileText,
  KeyRound,
  MessageCircle,
  Pencil,
  FilePlus2,
  RefreshCw,
  Save,
  Trash2,
  Table2,
  UserCheck,
  UserRoundPlus,
  Vote,
  XCircle,
} from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import DashboardWidgets from '../components/admin/DashboardWidgets'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Field from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import Panel from '../components/ui/Panel'
import SelectField from '../components/ui/SelectField'
import Skeleton from '../components/ui/Skeleton'
import StatCard from '../components/ui/StatCard'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import { downloadCsv } from '../utils/csvExport'
import { readFileAsDataUrl } from '../utils/fileUtils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`
const moneyPaisa = (value = 0) => money(Number(value || 0) / 100)

const bnMonths = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
]

const formatMonthYear = (month, year) =>
  month && year ? `${bnMonths[Number(month) - 1] || month} ${year}` : 'N/A'

const formatCoveredMonths = (months = []) =>
  months.length ? months.map((item) => formatMonthYear(item.month, item.year)).join(', ') : 'N/A'

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')
const toDateTimeInput = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '')
const toDate = (value) => (value ? new Date(value).toLocaleDateString('en-GB') : 'N/A')
const toExportDate = (value) => (value ? new Date(value).toISOString() : '')
const toReadableDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A')

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const cssVar = (name) =>
  window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const emptyContentForms = {
  notices: { title: '', body: '', audience: 'public', imageUrl: '', pinned: false },
  meetings: {
    title: '',
    agenda: '',
    meetingDate: '',
    location: '',
    audience: 'members',
    imageUrl: '',
  },
  tours: {
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    details: '',
    audience: 'members',
    imageUrl: '',
    status: 'planned',
  },
  activities: {
    title: '',
    category: '',
    description: '',
    activityDate: '',
    participantsCount: '',
    audience: 'public',
    imageUrl: '',
    status: 'planned',
  },
  rules: { title: '', description: '', audience: 'members', imageUrl: '', order: '' },
}

const contentConfigs = [
  { key: 'notices', title: 'Notices', endpoint: '/notices', main: 'body' },
  { key: 'meetings', title: 'Meetings', endpoint: '/meetings', main: 'agenda' },
  { key: 'tours', title: 'Tours', endpoint: '/tours', main: 'destination' },
  { key: 'activities', title: 'Activities', endpoint: '/activities', main: 'category' },
  { key: 'rules', title: 'Rules', endpoint: '/rules', main: 'description' },
]

const getContentEditForm = (key, item) => {
  if (key === 'notices') {
    return {
      title: item.title || '',
      body: item.body || '',
      audience: item.audience || 'public',
      imageUrl: item.imageUrl || '',
      pinned: Boolean(item.pinned),
    }
  }

  if (key === 'meetings') {
    return {
      title: item.title || '',
      agenda: item.agenda || '',
      meetingDate: toDateTimeInput(item.meetingDate),
      location: item.location || '',
      audience: item.audience || 'members',
      imageUrl: item.imageUrl || '',
    }
  }

  if (key === 'tours') {
    return {
      title: item.title || '',
      destination: item.destination || '',
      startDate: toDateInput(item.startDate),
      endDate: toDateInput(item.endDate),
      budget: item.budget || '',
      details: item.details || '',
      audience: item.audience || 'members',
      imageUrl: item.imageUrl || '',
      status: item.status || 'planned',
    }
  }

  if (key === 'activities') {
    return {
      title: item.title || '',
      category: item.category || '',
      description: item.description || '',
      activityDate: toDateInput(item.activityDate),
      participantsCount: item.participantsCount || '',
      audience: item.audience || 'public',
      imageUrl: item.imageUrl || '',
      status: item.status || 'planned',
    }
  }

  return {
    title: item.title || '',
    description: item.description || '',
    audience: item.audience || 'members',
    imageUrl: item.imageUrl || '',
    order: item.order || '',
  }
}

const tabLabels = [
  ['overview', 'Overview'],
  ['finance', 'Finance'],
  ['content', 'Content'],
  ['members', 'Members'],
  ['logs', 'Logs & Alerts'],
]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const defaultTab = location.pathname === '/admin/members' ? 'members' : 'overview'
  const activeTab = tabLabels.some(([key]) => key === requestedTab) ? requestedTab : defaultTab
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [data, setData] = useState({
    auditLogs: [],
    analytics: {
      donationTrend: [],
      expenseBreakdown: [],
      monthly: [],
      overdue: { amount: 0, count: 0, members: [] },
      range: {},
      summary: {},
    },
    content: { activities: [], meetings: [], notices: [], rules: [], tours: [] },
    donations: [],
    expenses: [],
    feeOverdue: { overdueMembers: [], summary: {} },
    payments: [],
    pendingRegistrations: [],
    polls: [],
    settings: {},
    users: [],
  })
  const [pollForm, setPollForm] = useState({
    deadline: '',
    meetingId: '',
    optionsText: 'Yes\nNo',
    question: '',
  })
  const [settingsForm, setSettingsForm] = useState({
    donationNumber: '',
    donationProvider: '',
    notificationSettings: {
      smsFeeReminderEnabled: false,
      smsMeetingEnabled: false,
      smsNoticeEnabled: false,
      whatsappFeeReminderEnabled: false,
      whatsappMeetingEnabled: false,
      whatsappNoticeEnabled: false,
    },
    monthlyFee: 0,
    feeDueDay: 1,
    feeLateFeeAmount: 0,
    feeOverdueAlertEnabled: true,
    registrationFee: 0,
  })
  const [financeFilter, setFinanceFilter] = useState({
    from: '',
    range: 'last_6_months',
    to: '',
  })
  const [donationForm, setDonationForm] = useState({
    amount: '',
    anonymous: false,
    donorName: '',
    method: 'Cash',
    note: '',
    phone: '',
    transactionId: '',
  })
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
    receiptImageUrl: '',
    title: '',
  })
  const [monthlyStatusMonth, setMonthlyStatusMonth] = useState(
    new Date().toISOString().slice(0, 7),
  )
  const [monthlyStatus, setMonthlyStatus] = useState(null)
  const [contentForms, setContentForms] = useState(emptyContentForms)
  const [editingContent, setEditingContent] = useState({})
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [uploadingContentKey, setUploadingContentKey] = useState('')
  const [uploadingExpenseReceipt, setUploadingExpenseReceipt] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [notificationForm, setNotificationForm] = useState({
    link: '',
    message: '',
    role: '',
    channel: 'sms',
    title: '',
    type: 'general',
  })

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const [
        pendingResponse,
        settingsResponse,
        usersResponse,
        paymentsResponse,
        donationsResponse,
        expensesResponse,
        noticesResponse,
        meetingsResponse,
        toursResponse,
        activitiesResponse,
        rulesResponse,
        auditLogsResponse,
        analyticsResponse,
        pollsResponse,
        feeOverdueResponse,
      ] = await Promise.all([
        api.get('/registrations/pending'),
        api.get('/settings/public'),
        api.get('/members/users'),
        api.get('/payments'),
        api.get('/donations'),
        api.get('/expenses'),
        api.get('/notices/members'),
        api.get('/meetings/members'),
        api.get('/tours/members'),
        api.get('/activities/members'),
        api.get('/rules/members'),
        api.get('/audit-logs', { params: { limit: 80 } }),
        api.get('/finance/analytics'),
        api.get('/polls'),
        api.get('/fees/overdue-members'),
      ])

      const settings = settingsResponse.data.data.settings
      setData({
        auditLogs: auditLogsResponse.data.data.logs,
        analytics: analyticsResponse.data.data,
        content: {
          activities: activitiesResponse.data.data.items,
          meetings: meetingsResponse.data.data.items,
          notices: noticesResponse.data.data.items,
          rules: rulesResponse.data.data.items,
          tours: toursResponse.data.data.items,
        },
        donations: donationsResponse.data.data.donations,
        expenses: expensesResponse.data.data.expenses,
        feeOverdue: feeOverdueResponse.data.data,
        payments: paymentsResponse.data.data.payments,
        pendingRegistrations: pendingResponse.data.data.users,
        polls: pollsResponse.data.data.polls,
        settings,
        users: usersResponse.data.data.users,
      })
      setSettingsForm({
        donationNumber: settings.donationNumber || '',
        donationProvider: settings.donationProvider || '',
        notificationSettings: {
          smsFeeReminderEnabled: Boolean(settings.notificationSettings?.smsFeeReminderEnabled),
          smsMeetingEnabled: Boolean(settings.notificationSettings?.smsMeetingEnabled),
          smsNoticeEnabled: Boolean(settings.notificationSettings?.smsNoticeEnabled),
          whatsappFeeReminderEnabled: Boolean(
            settings.notificationSettings?.whatsappFeeReminderEnabled,
          ),
          whatsappMeetingEnabled: Boolean(settings.notificationSettings?.whatsappMeetingEnabled),
          whatsappNoticeEnabled: Boolean(settings.notificationSettings?.whatsappNoticeEnabled),
        },
        monthlyFee: settings.monthlyFee || Number(settings.monthlyFeeAmount || 0) / 100,
        feeDueDay: settings.feeDueDay || 1,
        feeLateFeeAmount: Number(settings.feeLateFeeAmount || 0) / 100,
        feeOverdueAlertEnabled: settings.feeOverdueAlertEnabled !== false,
        registrationFee: settings.registrationFee || 0,
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
    const verifiedPayments = data.payments.filter((payment) => payment.status === 'verified')
    const verifiedDonations = data.donations.filter((donation) => donation.status === 'verified')
    const totalExpense = data.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const totalIncome = [...verifiedPayments, ...verifiedDonations].reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    )

    return {
      balance: totalIncome - totalExpense,
      members: data.users.filter((item) => item.status === 'approved' && item.role === 'member')
        .length,
      pending: data.pendingRegistrations.length,
      overdueFees: data.analytics.summary?.overdueFees || 0,
      overdueCount: data.analytics.overdue?.count || 0,
      thisMonthIncome: data.analytics.summary?.thisMonthIncome || 0,
      totalExpense,
      totalIncome,
    }
  }, [data])

  const runAction = async (action, successMessage) => {
    try {
      setMessage('')
      await action()
      setMessage(successMessage)
      await loadDashboard()
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const requestConfirm = (dialog) => {
    setConfirmDialog(dialog)
  }

  const closeConfirm = () => {
    setConfirmDialog(null)
  }

  const confirmSelectedAction = async () => {
    const action = confirmDialog?.action
    setConfirmDialog(null)

    if (action) {
      await action()
    }
  }

  const updateSettings = async (event) => {
    event.preventDefault()
    await runAction(async () => {
      await Promise.all([
        api.patch('/settings/registration-fee', {
          registrationFee: settingsForm.registrationFee,
        }),
        api.patch('/settings/monthly-fee', {
          monthlyFee: settingsForm.monthlyFee,
        }),
        api.patch('/settings/donation-number', {
          donationNumber: settingsForm.donationNumber,
          donationProvider: settingsForm.donationProvider,
        }),
        api.patch('/settings/notification-settings', settingsForm.notificationSettings),
        api.patch('/admin-controls', {
          feeDueDay: Number(settingsForm.feeDueDay || 1),
          feeLateFeeAmount: Math.round(Number(settingsForm.feeLateFeeAmount || 0) * 100),
          feeOverdueAlertEnabled: settingsForm.feeOverdueAlertEnabled,
        }),
      ])
    }, 'Settings updated successfully.')
  }

  const updateNotificationSetting = (field, value) => {
    setSettingsForm((current) => ({
      ...current,
      notificationSettings: {
        ...current.notificationSettings,
        [field]: value,
      },
    }))
  }

  const loadFinanceAnalytics = async () => {
    try {
      setMessage('')
      const response = await api.get('/finance/analytics', {
        params: {
          range: financeFilter.range,
          ...(financeFilter.range === 'custom'
            ? { from: financeFilter.from, to: financeFilter.to }
            : {}),
        },
      })
      setData((current) => ({
        ...current,
        analytics: response.data.data,
      }))
      setMessage('Finance analytics updated.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const changeTab = (tab) => {
    setSearchParams(tab === 'overview' ? {} : { tab })
  }

  const saveExpense = async (event) => {
    event.preventDefault()
    await runAction(async () => {
      if (editingExpenseId) {
        await api.patch(`/expenses/${editingExpenseId}`, expenseForm)
      } else {
        await api.post('/expenses', expenseForm)
      }

      setEditingExpenseId(null)
      setExpenseForm({
        amount: '',
        category: '',
        date: new Date().toISOString().slice(0, 10),
        note: '',
        receiptImageUrl: '',
        title: '',
      })
    }, editingExpenseId ? 'Expense updated successfully.' : 'Expense added successfully.')
  }

  const saveManualDonation = async (event) => {
    event.preventDefault()
    await runAction(async () => {
      await api.post('/donations/manual', donationForm)
      setDonationForm({
        amount: '',
        anonymous: false,
        donorName: '',
        method: 'Cash',
        note: '',
        phone: '',
        transactionId: '',
      })
    }, 'Manual donation recorded successfully.')
  }

  const editExpense = (expense) => {
    setEditingExpenseId(expense._id)
    setExpenseForm({
      amount: expense.amount || '',
      category: expense.category || '',
      date: toDateInput(expense.date),
      note: expense.note || '',
      receiptImageUrl: expense.receiptImageUrl || '',
      title: expense.title || '',
    })
  }

  const cancelExpenseEdit = () => {
    setEditingExpenseId(null)
    setExpenseForm({
      amount: '',
      category: '',
      date: new Date().toISOString().slice(0, 10),
      note: '',
      receiptImageUrl: '',
      title: '',
    })
  }

  const uploadExpenseReceipt = async (file) => {
    if (!file) {
      return
    }

    try {
      setMessage('')
      setUploadingExpenseReceipt(true)
      const image = await readFileAsDataUrl(file)
      const response = await api.post('/uploads/image', {
        image,
        name: `expense-receipt-${Date.now()}`,
      })
      setExpenseForm((current) => ({
        ...current,
        receiptImageUrl: response.data.data.image.url,
      }))
      setMessage('Expense receipt uploaded successfully.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setUploadingExpenseReceipt(false)
    }
  }

  const deleteExpense = async (id) => {
    requestConfirm({
      action: () =>
        runAction(async () => {
          await api.delete(`/expenses/${id}`)
        }, 'Expense deleted successfully.'),
      confirmLabel: 'Delete Expense',
      message: 'This expense will be removed from the finance list.',
      title: 'Delete expense?',
      variant: 'danger',
    })
  }

  const loadMonthlyStatus = async () => {
    await runAction(async () => {
      const response = await api.get('/payments/monthly-status', {
        params: { month: monthlyStatusMonth },
      })
      setMonthlyStatus(response.data.data)
    }, 'Monthly status loaded successfully.')
  }

  const updateContentForm = (key, field, value) => {
    setContentForms((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value,
      },
    }))
  }

  const uploadContentImage = async (key, file) => {
    if (!file) {
      return
    }

    try {
      setMessage('')
      setUploadingContentKey(key)
      const image = await readFileAsDataUrl(file)
      const response = await api.post('/uploads/image', {
        image,
        name: `${key}-${Date.now()}`,
      })
      updateContentForm(key, 'imageUrl', response.data.data.image.url)
      setMessage('Image uploaded successfully.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setUploadingContentKey('')
    }
  }

  const createContent = async (event, config) => {
    event.preventDefault()
    await runAction(async () => {
      const editingId = editingContent[config.key]

      if (editingId) {
        await api.patch(`${config.endpoint}/${editingId}`, contentForms[config.key])
      } else {
        await api.post(config.endpoint, contentForms[config.key])
      }

      setEditingContent((current) => ({
        ...current,
        [config.key]: null,
      }))
      setContentForms((current) => ({
        ...current,
        [config.key]: emptyContentForms[config.key],
      }))
    }, editingContent[config.key] ? `${config.title} item updated successfully.` : `${config.title} item created successfully.`)
  }

  const deleteContent = async (config, id) => {
    requestConfirm({
      action: () =>
        runAction(async () => {
          await api.delete(`${config.endpoint}/${id}`)
        }, `${config.title} item deleted successfully.`),
      confirmLabel: 'Delete Item',
      message: `This ${config.title.toLowerCase()} item will be removed.`,
      title: `Delete ${config.title.toLowerCase()} item?`,
      variant: 'danger',
    })
  }

  const editContent = (config, item) => {
    setEditingContent((current) => ({
      ...current,
      [config.key]: item._id,
    }))
    setContentForms((current) => ({
      ...current,
      [config.key]: getContentEditForm(config.key, item),
    }))
  }

  const cancelContentEdit = (config) => {
    setEditingContent((current) => ({
      ...current,
      [config.key]: null,
    }))
    setContentForms((current) => ({
      ...current,
      [config.key]: emptyContentForms[config.key],
    }))
  }

  const updateMemberProfile = async (id, payload) => {
    await runAction(async () => {
      await api.patch(`/members/${id}`, payload)
    }, 'Member profile updated successfully.')
  }

  const resetUserPassword = async (id, newPassword) => {
    await runAction(async () => {
      await api.patch(`/members/${id}/password`, { newPassword })
    }, 'User password reset successfully.')
  }

  const updateUserAccess = async (id, payload) => {
    await runAction(async () => {
      await api.patch(`/members/${id}/access`, payload)
    }, 'User access updated successfully.')
  }

  const saveMeetingAttendance = async (id, payload) => {
    await runAction(async () => {
      await api.patch(`/meetings/${id}/attendance`, payload)
    }, 'Meeting attendance saved successfully.')
  }

  const saveTourParticipants = async (id, payload) => {
    await runAction(async () => {
      await api.patch(`/tours/${id}/participants`, payload)
    }, 'Tour participants saved successfully.')
  }

  const createPoll = async (event) => {
    event.preventDefault()
    await runAction(async () => {
      await api.post('/polls', {
        deadline: pollForm.deadline,
        meetingId: pollForm.meetingId,
        options: pollForm.optionsText
          .split('\n')
          .map((option) => option.trim())
          .filter(Boolean),
        question: pollForm.question,
      })
      setPollForm({
        deadline: '',
        meetingId: '',
        optionsText: 'Yes\nNo',
        question: '',
      })
    }, 'Poll created successfully.')
  }

  const deleteUser = async (id) => {
    requestConfirm({
      action: () =>
        runAction(async () => {
          await api.delete(`/members/${id}`)
        }, 'User deleted successfully.'),
      confirmLabel: 'Delete User',
      message: 'This account will be permanently removed from the system.',
      title: 'Delete user?',
      variant: 'danger',
    })
  }

  const exportUsers = () => {
    const ok = downloadCsv(
      'dargah-users.csv',
      data.users.map((item) => ({
        address: item.address || '',
        createdAt: toExportDate(item.createdAt),
        name: item.name,
        phone: item.phone,
        role: item.role,
        status: item.status,
      })),
    )
    setMessage(ok ? 'Users CSV downloaded.' : 'No users to export.')
  }

  const exportPayments = () => {
    const ok = downloadCsv(
      'dargah-payments.csv',
      data.payments.map((item) => ({
        amount: item.amount,
        createdAt: toExportDate(item.createdAt),
        memberName: item.user?.name || '',
        memberPhone: item.user?.phone || '',
        method: item.method,
        month: item.month,
        senderPhone: item.senderPhone,
        status: item.status,
        transactionId: item.transactionId,
        proofImageUrl: item.proofImageUrl || '',
      })),
    )
    setMessage(ok ? 'Payments CSV downloaded.' : 'No payments to export.')
  }

  const exportDonations = () => {
    const ok = downloadCsv(
      'dargah-donations.csv',
      data.donations.map((item) => ({
        amount: item.amount,
        anonymous: item.anonymous ? 'yes' : 'no',
        createdAt: toExportDate(item.createdAt),
        donorName: item.donorName,
        manualEntry: item.manualEntry ? 'yes' : 'no',
        method: item.method,
        phone: item.phone,
        rejectionReason: item.rejectionReason || '',
        status: item.status,
        transactionId: item.transactionId,
        proofImageUrl: item.proofImageUrl || '',
      })),
    )
    setMessage(ok ? 'Donations CSV downloaded.' : 'No donations to export.')
  }

  const exportExpenses = () => {
    const ok = downloadCsv(
      'dargah-expenses.csv',
      data.expenses.map((item) => ({
        amount: item.amount,
        category: item.category,
        date: toExportDate(item.date),
        note: item.note || '',
        receiptImageUrl: item.receiptImageUrl || '',
        title: item.title,
      })),
    )
    setMessage(ok ? 'Expenses CSV downloaded.' : 'No expenses to export.')
  }

  const exportBackup = async () => {
    await runAction(async () => {
      const response = await api.get('/backup')
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dargah-para-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }, 'Backup downloaded successfully.')
  }

  const printReceipt = async (endpoint) => {
    try {
      setMessage('')
      const response = await api.get(endpoint)
      const receipt = response.data.data.receipt
      const printWindow = window.open('', '_blank', 'noopener,noreferrer')

      if (!printWindow) {
        setMessage('Allow popups to print the receipt.')
        return
      }

      const personName =
        receipt.payment?.user?.name || receipt.user?.name || receipt.donation?.donorName || 'N/A'
      const transactionId =
        receipt.payment?.transactionId ||
        receipt.registrationPayment?.transactionId ||
        receipt.donation?.transactionId ||
        'N/A'
      const amount =
        receipt.payment?.amount || receipt.registrationPayment?.amount || receipt.donation?.amount || 0
      const status =
        receipt.payment?.status || receipt.registrationPayment?.status || receipt.donation?.status || 'N/A'
      const method =
        receipt.payment?.method || receipt.registrationPayment?.method || receipt.donation?.method || 'N/A'
      const qrHtml = receipt.payment?.qrCodeDataUrl
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
              <p class="muted">Receipt No: ${escapeHtml(receipt.receiptNo)} | Issued: ${escapeHtml(toReadableDate(receipt.issuedAt))}</p>
              <div class="grid">
                <div class="item"><span class="label">Name</span><span class="value">${escapeHtml(personName || 'N/A')}</span></div>
                <div class="item"><span class="label">Type</span><span class="value">${escapeHtml(receipt.type)}</span></div>
                <div class="item"><span class="label">Amount</span><span class="value">${escapeHtml(money(amount))}</span></div>
                <div class="item"><span class="label">Method</span><span class="value">${escapeHtml(method)}</span></div>
                <div class="item"><span class="label">Transaction ID</span><span class="value">${escapeHtml(transactionId)}</span></div>
                <div class="item"><span class="label">Status</span><span class="value">${escapeHtml(status)}</span></div>
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

  const sendBroadcastNotification = async (event) => {
    event.preventDefault()
    await runAction(async () => {
      await api.post('/notifications/send', notificationForm)
      setNotificationForm({
        channel: 'sms',
        link: '',
        message: '',
        role: '',
        title: '',
        type: 'general',
      })
    }, 'Notification sent successfully.')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">Admin</p>
          <h1 className="text-2xl font-bold text-gray-950">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Signed in as {user?.name}</p>
        </div>
        <Button icon={RefreshCw} onClick={loadDashboard} variant="secondary">
          Refresh
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabLabels.map(([key, label]) => (
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

      {loading ? (
        <Panel className="mt-6">
          <Skeleton rows={6} />
        </Panel>
      ) : null}

      {!loading && activeTab === 'overview' ? (
        <OverviewTab
          data={data}
          onExportDonations={exportDonations}
          onExportExpenses={exportExpenses}
          onExportPayments={exportPayments}
          onExportUsers={exportUsers}
          onExportBackup={exportBackup}
          onApprove={(id) =>
            requestConfirm({
              action: () =>
                runAction(
                  () => api.patch(`/registrations/${id}/approve`),
                  'Registration approved.',
                ),
              confirmLabel: 'Approve',
              message: 'This pending user will become an approved member.',
              title: 'Approve registration?',
            })
          }
          onReject={(id) =>
            {
              const reason = window.prompt('Reject reason')

              if (reason === null) {
                return
              }

              const trimmedReason = reason.trim()

              if (!trimmedReason) {
                setMessage('Reject reason is required.')
                return
              }

              requestConfirm({
                action: () =>
                  runAction(
                    () => api.patch(`/registrations/${id}/reject`, { reason: trimmedReason }),
                    'Registration rejected.',
                  ),
                confirmLabel: 'Reject',
                message: `This registration will be rejected. Reason: ${trimmedReason}`,
                title: 'Reject registration?',
                variant: 'danger',
              })
            }
          }
          onRegistrationReceipt={(id) => printReceipt(`/receipts/registrations/${id}`)}
          onTabChange={changeTab}
          stats={stats}
        />
      ) : null}

      {!loading && activeTab === 'finance' ? (
        <FinanceTab
          data={data}
          donationForm={donationForm}
          expenseForm={expenseForm}
          editingExpenseId={editingExpenseId}
          financeFilter={financeFilter}
          monthlyStatus={monthlyStatus}
          monthlyStatusMonth={monthlyStatusMonth}
          onCancelExpenseEdit={cancelExpenseEdit}
          onDeleteExpense={deleteExpense}
          onEditExpense={editExpense}
          onSaveExpense={saveExpense}
          onExpenseChange={(field, value) =>
            setExpenseForm((current) => ({ ...current, [field]: value }))
          }
          onDonationChange={(field, value) =>
            setDonationForm((current) => ({ ...current, [field]: value }))
          }
          onExpenseReceiptUpload={uploadExpenseReceipt}
          onFinanceFilterChange={(field, value) =>
            setFinanceFilter((current) => ({ ...current, [field]: value }))
          }
          onLoadMonthlyStatus={loadMonthlyStatus}
          onLoadFinanceAnalytics={loadFinanceAnalytics}
          onMonthChange={setMonthlyStatusMonth}
          onPaymentReject={(id, reason) => {
            const trimmedReason = reason?.trim() || window.prompt('Payment rejection reason')?.trim()
            if (!trimmedReason) {
              setMessage('Payment rejection reason is required.')
              return Promise.resolve()
            }

            return runAction(
              () => api.patch(`/payments/${id}/reject`, { reason: trimmedReason }),
              'Payment rejected.',
            )
          }}
          onPaymentBulkReject={(paymentIds, reason) =>
            runAction(
              () => api.patch('/payments/bulk-reject', { paymentIds, reason }),
              `${paymentIds.length} payments rejected.`,
            )
          }
          onPaymentBulkVerify={(paymentIds) =>
            runAction(
              () => api.patch('/payments/bulk-verify', { paymentIds }),
              `${paymentIds.length} payments verified.`,
            )
          }
          onPaymentReceipt={(id) => printReceipt(`/receipts/payments/${id}`)}
          onPaymentVerify={(id) =>
            runAction(() => api.patch(`/payments/${id}/verify`), 'Payment verified.')
          }
          onFeeReminder={(member) =>
            runAction(
              () => api.post(`/fees/member/${member.memberId}/reminder`),
              'Reminder sent.',
            )
          }
          onFeeAdjust={(payload) =>
            runAction(() => api.post('/fees/adjust', payload), 'Fee amount adjusted.')
          }
          onFeeAdjustmentRemove={(id) =>
            runAction(() => api.delete(`/fees/adjust/${id}`), 'Fee adjustment removed.')
          }
          onFeeWaive={(payload) =>
            runAction(() => api.post('/fees/waive', payload), 'Fee waiver saved.')
          }
          onFeeWaiverRemove={(id) =>
            runAction(() => api.delete(`/fees/waive/${id}`), 'Fee waiver removed.')
          }
          onMemberFeeHistory={(memberId, year) =>
            api.get(`/fees/member/${memberId}/history`, { params: { year } })
          }
          onDonationReject={(id, reason) => {
            const trimmedReason = reason?.trim() || window.prompt('Donation rejection reason')?.trim()
            if (!trimmedReason) {
              setMessage('Donation rejection reason is required.')
              return Promise.resolve()
            }

            return runAction(
              () => api.patch(`/donations/${id}/reject`, { reason: trimmedReason }),
              'Donation rejected.',
            )
          }}
          onDonationReceipt={(id) => printReceipt(`/receipts/donations/${id}`)}
          onDonationVerify={(id) =>
            runAction(() => api.patch(`/donations/${id}/verify`), 'Donation verified.')
          }
          onSettingsChange={(field, value) =>
            setSettingsForm((current) => ({ ...current, [field]: value }))
          }
          onNotificationSettingChange={updateNotificationSetting}
          onSaveManualDonation={saveManualDonation}
          onUpdateSettings={updateSettings}
          settingsForm={settingsForm}
          uploadingExpenseReceipt={uploadingExpenseReceipt}
        />
      ) : null}

      {!loading && activeTab === 'content' ? (
        <ContentTab
          contentForms={contentForms}
          data={data}
          editingContent={editingContent}
          onCancelEdit={cancelContentEdit}
          onCreate={createContent}
          onDelete={deleteContent}
          onEdit={editContent}
          onFormChange={updateContentForm}
          onImageUpload={uploadContentImage}
          onPollChange={(field, value) =>
            setPollForm((current) => ({ ...current, [field]: value }))
          }
          onPollCreate={createPoll}
          onSaveMeetingAttendance={saveMeetingAttendance}
          onSaveTourParticipants={saveTourParticipants}
          pollForm={pollForm}
          uploadingContentKey={uploadingContentKey}
        />
      ) : null}

      {!loading && activeTab === 'members' ? (
        <MembersTab
          onDeleteUser={deleteUser}
          onResetPassword={resetUserPassword}
          onUpdateAccess={updateUserAccess}
          onUpdateProfile={updateMemberProfile}
          payments={data.payments}
          users={data.users}
        />
      ) : null}

      {!loading && activeTab === 'logs' ? (
        <LogsTab
          auditLogs={data.auditLogs}
          notificationForm={notificationForm}
          onNotificationChange={(field, value) =>
            setNotificationForm((current) => ({ ...current, [field]: value }))
          }
          onSendNotification={sendBroadcastNotification}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel={confirmDialog?.confirmLabel}
        message={confirmDialog?.message}
        onCancel={closeConfirm}
        onConfirm={confirmSelectedAction}
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        variant={confirmDialog?.variant}
      />
    </main>
  )
}

function OverviewTab({
  data,
  onApprove,
  onExportBackup,
  onExportDonations,
  onExportExpenses,
  onExportPayments,
  onExportUsers,
  onReject,
  onRegistrationReceipt,
  onTabChange,
  stats,
}) {
  const financeSnapshot = [
    ['মোট আয়', money(stats.totalIncome)],
    ['মোট ব্যয়', money(stats.totalExpense)],
    ['নেট ব্যালেন্স', money(stats.balance)],
  ]
  const [pendingFilter, setPendingFilter] = useState({ address: '', from: '', to: '' })
  const filteredPendingRegistrations = useMemo(() => {
    const fromTime = pendingFilter.from ? new Date(pendingFilter.from).setHours(0, 0, 0, 0) : null
    const toTime = pendingFilter.to ? new Date(pendingFilter.to).setHours(23, 59, 59, 999) : null
    const address = pendingFilter.address.trim().toLowerCase()

    return data.pendingRegistrations.filter((item) => {
      const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0
      const matchesFrom = !fromTime || createdAt >= fromTime
      const matchesTo = !toTime || createdAt <= toTime
      const matchesAddress = !address || item.address?.toLowerCase().includes(address)

      return matchesFrom && matchesTo && matchesAddress
    })
  }, [data.pendingRegistrations, pendingFilter])

  return (
    <div className="mt-6 grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserCheck} label="মোট সদস্য" trend="↑ active" value={stats.members} />
        <StatCard
          icon={UserRoundPlus}
          label="অপেক্ষমাণ আবেদন"
          tone="yellow"
          trend="নতুন আবেদন"
          value={stats.pending}
        />
        <StatCard
          icon={DollarSign}
          label="এই মাসের আয়"
          tone="green"
          trend="↑ মাসিক"
          value={money(stats.thisMonthIncome)}
        />
        <StatCard
          icon={XCircle}
          label="বকেয়া ফি"
          tone="red"
          trend={`${stats.overdueCount} জন`}
          value={money(stats.overdueFees)}
        />
      </div>

      <DashboardWidgets />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle icon={ClipboardList} title="সাম্প্রতিক নিবন্ধন" />
            <Badge value="pending">{filteredPendingRegistrations.length} pending</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Field
              label="From"
              name="pendingFrom"
              onChange={(event) =>
                setPendingFilter((current) => ({ ...current, from: event.target.value }))
              }
              type="date"
              value={pendingFilter.from}
            />
            <Field
              label="To"
              name="pendingTo"
              onChange={(event) =>
                setPendingFilter((current) => ({ ...current, to: event.target.value }))
              }
              type="date"
              value={pendingFilter.to}
            />
            <Field
              label="Area / address"
              name="pendingAddress"
              onChange={(event) =>
                setPendingFilter((current) => ({ ...current, address: event.target.value }))
              }
              value={pendingFilter.address}
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['নাম', 'ফোন', 'পেমেন্ট', 'স্ট্যাটাস', 'অ্যাকশন'].map((heading) => (
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredPendingRegistrations.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>
                      No pending registrations.
                    </td>
                  </tr>
                ) : null}
                {filteredPendingRegistrations.slice(0, 6).map((item) => (
                  <tr className="transition hover:bg-gray-50" key={item._id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.address}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {money(item.registrationPayment?.amount)} |{' '}
                      {item.registrationPayment?.method || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={item.status}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          icon={FileText}
                          onClick={() => onRegistrationReceipt(item._id)}
                          variant="secondary"
                        >
                          Receipt
                        </Button>
                        <Button icon={CheckCircle2} onClick={() => onApprove(item._id)}>
                          Approve
                        </Button>
                        <Button
                          icon={XCircle}
                          onClick={() => onReject(item._id)}
                          variant="danger"
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel>
            <SectionTitle icon={DollarSign} title="অর্থ সারাংশ" />
            <div className="mt-4 grid gap-3">
              {financeSnapshot.map(([label, value]) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                  key={label}
                >
                  <span className="text-sm font-medium text-gray-500">{label}</span>
                  <span className="text-lg font-bold tracking-tight text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle icon={FilePlus2} title="দ্রুত কাজ" />
            <div className="mt-4 grid gap-3">
              <Button icon={Bell} onClick={() => onTabChange('content')}>
                নোটিশ দিন
              </Button>
              <Button icon={ClipboardList} onClick={() => onTabChange('content')} variant="secondary">
                মিটিং যোগ করুন
              </Button>
              <Button icon={DollarSign} onClick={() => onTabChange('finance')} variant="secondary">
                ব্যয় যোগ করুন
              </Button>
            </div>
          </Panel>

          <Panel>
            <SectionTitle icon={Download} title="রিপোর্ট এক্সপোর্ট" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button icon={Download} onClick={onExportUsers} variant="secondary">
                Users
              </Button>
              <Button icon={Download} onClick={onExportPayments} variant="secondary">
                Payments
              </Button>
              <Button icon={Download} onClick={onExportDonations} variant="secondary">
                Donations
              </Button>
              <Button icon={DatabaseBackup} onClick={onExportBackup} variant="secondary">
                Backup
              </Button>
              <Button className="sm:col-span-2" icon={Download} onClick={onExportExpenses} variant="secondary">
                Expenses
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function FinanceTab({
  data,
  donationForm,
  editingExpenseId,
  expenseForm,
  financeFilter,
  monthlyStatus,
  monthlyStatusMonth,
  onCancelExpenseEdit,
  onDeleteExpense,
  onEditExpense,
  onDonationReject,
  onDonationVerify,
  onDonationChange,
  onExpenseChange,
  onExpenseReceiptUpload,
  onFinanceFilterChange,
  onLoadMonthlyStatus,
  onLoadFinanceAnalytics,
  onMonthChange,
  onPaymentBulkReject,
  onPaymentBulkVerify,
  onPaymentReject,
  onPaymentReceipt,
  onPaymentVerify,
  onFeeAdjust,
  onFeeAdjustmentRemove,
  onFeeReminder,
  onFeeWaive,
  onFeeWaiverRemove,
  onMemberFeeHistory,
  onDonationReceipt,
  onSaveManualDonation,
  onSaveExpense,
  onNotificationSettingChange,
  onSettingsChange,
  onUpdateSettings,
  settingsForm,
  uploadingExpenseReceipt,
}) {
  const verifiedPayments = data.payments.filter((payment) => payment.status === 'verified')
  const verifiedDonations = data.donations.filter((donation) => donation.status === 'verified')
  const totalPayments = verifiedPayments.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalDonations = verifiedDonations.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalExpenses = data.expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const expenseCategories = Object.entries(
    data.expenses.reduce((totals, item) => {
      const key = item.category || 'Other'
      totals[key] = (totals[key] || 0) + Number(item.amount)
      return totals
    }, {}),
  ).sort((left, right) => right[1] - left[1])
  const [activeFinanceTab, setActiveFinanceTab] = useState('payments')
  const expenseCategoryOptions = ['ভাড়া', 'খাবার', 'অনুষ্ঠান', 'অন্যান্য']
  const expenseCategoriesForSelect =
    expenseForm.category && !expenseCategoryOptions.includes(expenseForm.category)
      ? [expenseForm.category, ...expenseCategoryOptions]
      : expenseCategoryOptions

  return (
    <div className="mt-6 grid gap-6">
      <FinanceAnalytics
        analytics={data.analytics}
        filter={financeFilter}
        onFilterChange={onFinanceFilterChange}
        onLoad={onLoadFinanceAnalytics}
      />

      <FinanceSummary
        expenseCategories={expenseCategories}
        totalDonations={totalDonations}
        totalExpenses={totalExpenses}
        totalPayments={totalPayments}
      />

      <OverdueMembersPanel
        overdueData={data.feeOverdue}
        onHistory={onMemberFeeHistory}
        onAdjust={onFeeAdjust}
        onRemoveAdjustment={onFeeAdjustmentRemove}
        onPaymentReject={onPaymentReject}
        onPaymentVerify={onPaymentVerify}
        onReminder={onFeeReminder}
        onRemoveWaiver={onFeeWaiverRemove}
        onWaive={onFeeWaive}
      />

      <Panel>
        <SectionTitle icon={Save} title="Finance Settings" />
        <form className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={onUpdateSettings}>
          <Field
            label="Registration Fee"
            name="registrationFee"
            onChange={(event) => onSettingsChange('registrationFee', event.target.value)}
            type="number"
            value={settingsForm.registrationFee}
          />
          <Field
            label="Monthly Fee"
            name="monthlyFee"
            onChange={(event) => onSettingsChange('monthlyFee', event.target.value)}
            type="number"
            value={settingsForm.monthlyFee}
          />
          <Field
            label="Donation Number"
            name="donationNumber"
            onChange={(event) => onSettingsChange('donationNumber', event.target.value)}
            value={settingsForm.donationNumber}
          />
          <Field
            label="Donation Provider"
            name="donationProvider"
            onChange={(event) => onSettingsChange('donationProvider', event.target.value)}
            value={settingsForm.donationProvider}
          />
          <Field
            label="Fee Due Day"
            max="28"
            min="1"
            name="feeDueDay"
            onChange={(event) => onSettingsChange('feeDueDay', event.target.value)}
            type="number"
            value={settingsForm.feeDueDay}
          />
          <Field
            label="Late Fee"
            min="0"
            name="feeLateFeeAmount"
            onChange={(event) => onSettingsChange('feeLateFeeAmount', event.target.value)}
            type="number"
            value={settingsForm.feeLateFeeAmount}
          />
          <ToggleField
            checked={settingsForm.feeOverdueAlertEnabled}
            label="Enable overdue alerts"
            onChange={(value) => onSettingsChange('feeOverdueAlertEnabled', value)}
          />
          <Button className="md:col-span-2 xl:col-span-4" icon={Save} type="submit">
            Save Settings
          </Button>
        </form>
      </Panel>

      <Panel>
        <SectionTitle icon={Bell} title="SMS and WhatsApp Triggers" />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ToggleField
            checked={settingsForm.notificationSettings.smsNoticeEnabled}
            label="SMS on new notice"
            onChange={(value) => onNotificationSettingChange('smsNoticeEnabled', value)}
          />
          <ToggleField
            checked={settingsForm.notificationSettings.smsMeetingEnabled}
            label="SMS on meeting scheduled"
            onChange={(value) => onNotificationSettingChange('smsMeetingEnabled', value)}
          />
          <ToggleField
            checked={settingsForm.notificationSettings.smsFeeReminderEnabled}
            label="SMS fee reminder"
            onChange={(value) => onNotificationSettingChange('smsFeeReminderEnabled', value)}
          />
          <ToggleField
            checked={settingsForm.notificationSettings.whatsappNoticeEnabled}
            label="WhatsApp on new notice"
            onChange={(value) => onNotificationSettingChange('whatsappNoticeEnabled', value)}
          />
          <ToggleField
            checked={settingsForm.notificationSettings.whatsappMeetingEnabled}
            label="WhatsApp on meeting scheduled"
            onChange={(value) => onNotificationSettingChange('whatsappMeetingEnabled', value)}
          />
          <ToggleField
            checked={settingsForm.notificationSettings.whatsappFeeReminderEnabled}
            label="WhatsApp fee reminder"
            onChange={(value) => onNotificationSettingChange('whatsappFeeReminderEnabled', value)}
          />
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Twilio credentials must be configured on the server before SMS or WhatsApp messages are sent.
        </p>
      </Panel>

      <Panel>
        <SectionTitle icon={CheckCircle2} title="Monthly Fee Status" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Field
            label="Month"
            name="month"
            onChange={(event) => onMonthChange(event.target.value)}
            type="month"
            value={monthlyStatusMonth}
          />
          <div className="flex items-end">
            <Button icon={RefreshCw} onClick={onLoadMonthlyStatus}>
              Load Status
            </Button>
          </div>
        </div>
        {monthlyStatus ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <MiniList items={monthlyStatus.paidMembers} title={`Paid (${monthlyStatus.paidCount})`} />
            <MiniList
              items={monthlyStatus.unpaidMembers}
              title={`Unpaid (${monthlyStatus.unpaidCount})`}
            />
          </div>
        ) : null}
      </Panel>

      <Panel>
        <SectionTitle icon={DollarSign} title="Add Manual Donation" />
        <form className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={onSaveManualDonation}>
          <ToggleField
            checked={donationForm.anonymous}
            label="Anonymous donor"
            onChange={(value) => onDonationChange('anonymous', value)}
          />
          <Field
            disabled={donationForm.anonymous}
            label="Donor Name"
            name="manualDonorName"
            onChange={(event) => onDonationChange('donorName', event.target.value)}
            value={donationForm.donorName}
          />
          <Field
            label="Phone"
            name="manualDonorPhone"
            onChange={(event) => onDonationChange('phone', event.target.value)}
            value={donationForm.phone}
          />
          <Field
            label="Amount"
            min="1"
            name="manualDonationAmount"
            onChange={(event) => onDonationChange('amount', event.target.value)}
            required
            type="number"
            value={donationForm.amount}
          />
          <SelectField
            label="Method"
            name="manualDonationMethod"
            onChange={(event) => onDonationChange('method', event.target.value)}
            value={donationForm.method}
          >
            <option value="Cash">Cash</option>
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
            <option value="Bank">Bank</option>
          </SelectField>
          <Field
            label="Transaction ID"
            name="manualDonationTransactionId"
            onChange={(event) => onDonationChange('transactionId', event.target.value)}
            placeholder="Auto-generated for cash if blank"
            value={donationForm.transactionId}
          />
          <Field
            className="md:col-span-2 xl:col-span-3"
            label="Note"
            name="manualDonationNote"
            onChange={(event) => onDonationChange('note', event.target.value)}
            value={donationForm.note}
          />
          <Button className="md:col-span-2 xl:col-span-5" icon={DollarSign} type="submit">
            Record Donation
          </Button>
        </form>
      </Panel>

      <Panel>
        <SectionTitle icon={FilePlus2} title={editingExpenseId ? 'Edit Expense' : 'Add Expense'} />
        <form className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={onSaveExpense}>
          <Field
            label="Title"
            name="title"
            onChange={(event) => onExpenseChange('title', event.target.value)}
            required
            value={expenseForm.title}
          />
          <Field
            label="Amount"
            name="amount"
            onChange={(event) => onExpenseChange('amount', event.target.value)}
            required
            type="number"
            value={expenseForm.amount}
          />
          <SelectField
            label="Category"
            name="category"
            onChange={(event) => onExpenseChange('category', event.target.value)}
            required
            value={expenseForm.category}
          >
            <option value="">Select category</option>
            {expenseCategoriesForSelect.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectField>
          <Field
            label="Date"
            name="date"
            onChange={(event) => onExpenseChange('date', event.target.value)}
            required
            type="date"
            value={expenseForm.date}
          />
          <Field
            label="Note"
            name="note"
            onChange={(event) => onExpenseChange('note', event.target.value)}
            value={expenseForm.note}
          />
          <div className="grid gap-3 md:col-span-2 xl:col-span-5">
            <Field
              label="Receipt Image URL"
              name="receiptImageUrl"
              onChange={(event) => onExpenseChange('receiptImageUrl', event.target.value)}
              value={expenseForm.receiptImageUrl}
            />
            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
              <span>Upload Receipt Image</span>
              <input
                accept="image/*"
                className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                disabled={uploadingExpenseReceipt}
                onChange={(event) => onExpenseReceiptUpload(event.target.files?.[0])}
                type="file"
              />
            </label>
            {uploadingExpenseReceipt ? (
              <p className="text-sm font-medium text-indigo-700">Uploading receipt...</p>
            ) : null}
          </div>
          <Button className="md:col-span-2 xl:col-span-4" icon={FilePlus2} type="submit">
            {editingExpenseId ? 'Update Expense' : 'Add Expense'}
          </Button>
          {editingExpenseId ? (
            <Button onClick={onCancelExpenseEdit} variant="secondary">
              Cancel
            </Button>
          ) : null}
        </form>
      </Panel>

      <FinanceRecordsTabs
        activeTab={activeFinanceTab}
        donations={data.donations}
        expenses={data.expenses}
        onDonationReceipt={onDonationReceipt}
        onDonationReject={onDonationReject}
        onDonationVerify={onDonationVerify}
        onEditExpense={onEditExpense}
        onDeleteExpense={onDeleteExpense}
        onPaymentBulkReject={onPaymentBulkReject}
        onPaymentBulkVerify={onPaymentBulkVerify}
        onPaymentReceipt={onPaymentReceipt}
        onPaymentReject={onPaymentReject}
        onPaymentVerify={onPaymentVerify}
        payments={data.payments}
        setActiveTab={setActiveFinanceTab}
      />
    </div>
  )
}

function ToggleField({ checked, label, onChange }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
      <input
        checked={checked}
        className="h-4 w-4 accent-indigo-700"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}

function FinanceAnalytics({ analytics, filter, onFilterChange, onLoad }) {
  const monthly = analytics?.monthly || []
  const donationTrend = analytics?.donationTrend || []
  const expenseBreakdown = analytics?.expenseBreakdown || []
  const overdueMembers = analytics?.overdue?.members || []
  const summary = analytics?.summary || {}
  const range = analytics?.range || {}
  const pieColors = ['#00ADB5', '#393E46', '#10B981', '#F59E0B', '#EF4444', '#6366F1']

  const exportReport = () => {
    const ok = downloadCsv(
      `finance-report-${range.from || 'start'}-${range.to || 'end'}.csv`,
      monthly.map((row) => ({
        balance: row.balance,
        donationIncome: row.donationIncome,
        expense: row.expense,
        income: row.income,
        month: row.month,
        paymentIncome: row.paymentIncome,
        rangeFrom: range.from || '',
        rangeTo: range.to || '',
      })),
    )

    if (!ok) {
      window.alert('No finance report data to export.')
    }
  }

  const printReport = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) return

    const rows = monthly
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.month)}</td>
            <td>${escapeHtml(money(row.paymentIncome))}</td>
            <td>${escapeHtml(money(row.donationIncome))}</td>
            <td>${escapeHtml(money(row.expense))}</td>
            <td>${escapeHtml(money(row.balance))}</td>
          </tr>
        `,
      )
      .join('')
    const categories = expenseBreakdown
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.category)}</td>
            <td>${escapeHtml(money(item.amount))}</td>
          </tr>
        `,
      )
      .join('')

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Finance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: ${cssVar('--text-primary')}; }
            h1 { margin: 0 0 4px; font-size: 22px; }
            h2 { margin: 24px 0 8px; font-size: 16px; }
            .muted { color: ${cssVar('--text-secondary')}; margin: 0 0 16px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0; }
            .stat { border: 1px solid ${cssVar('--gray-200')}; border-radius: 8px; padding: 12px; }
            .label { color: ${cssVar('--text-secondary')}; display: block; font-size: 11px; text-transform: uppercase; }
            .value { display: block; font-size: 16px; font-weight: 700; margin-top: 4px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid ${cssVar('--gray-200')}; padding: 10px; text-align: left; }
            th { background: ${cssVar('--surface-1')}; font-size: 12px; text-transform: uppercase; color: ${cssVar('--text-secondary')}; }
          </style>
        </head>
        <body>
          <h1>Dargah Para OIkko Porishod - Finance Report</h1>
          <p class="muted">${escapeHtml(range.from || '')} to ${escapeHtml(range.to || '')}</p>
          <div class="stats">
            <div class="stat"><span class="label">Income</span><span class="value">${escapeHtml(money(summary.totalIncome))}</span></div>
            <div class="stat"><span class="label">Expense</span><span class="value">${escapeHtml(money(summary.totalExpense))}</span></div>
            <div class="stat"><span class="label">Net Balance</span><span class="value">${escapeHtml(money(summary.netBalance))}</span></div>
            <div class="stat"><span class="label">Collection Rate</span><span class="value">${escapeHtml(summary.collectionRate || 0)}%</span></div>
          </div>
          <h2>Monthly Report</h2>
          <table>
            <thead><tr><th>Month</th><th>Fees</th><th>Donations</th><th>Expenses</th><th>Balance</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <h2>Expense Breakdown</h2>
          <table>
            <thead><tr><th>Category</th><th>Amount</th></tr></thead>
            <tbody>${categories || '<tr><td colspan="2">No expense data.</td></tr>'}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel className="xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionTitle icon={ClipboardList} title="Finance Analytics" />
          <div className="flex flex-wrap gap-2">
            <Button icon={Download} onClick={exportReport} variant="secondary">
              CSV
            </Button>
            <Button icon={FileDown} onClick={printReport} variant="secondary">
              PDF
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SelectField
            label="Date Range"
            name="financeRange"
            onChange={(event) => onFilterChange('range', event.target.value)}
            value={filter.range}
          >
            <option value="last_6_months">Last 6 months</option>
            <option value="this_month">This month</option>
            <option value="last_3_months">Last 3 months</option>
            <option value="this_year">This year</option>
            <option value="custom">Custom</option>
          </SelectField>
          <Field
            disabled={filter.range !== 'custom'}
            label="From"
            name="financeFrom"
            onChange={(event) => onFilterChange('from', event.target.value)}
            type="date"
            value={filter.from}
          />
          <Field
            disabled={filter.range !== 'custom'}
            label="To"
            name="financeTo"
            onChange={(event) => onFilterChange('to', event.target.value)}
            type="date"
            value={filter.to}
          />
          <div className="flex items-end">
            <Button className="w-full" icon={RefreshCw} onClick={onLoad}>
              Apply
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SummaryStat label="Income" value={money(summary.totalIncome || 0)} />
          <SummaryStat label="Expense" value={money(summary.totalExpense || 0)} />
          <SummaryStat label="Net Balance" value={money(summary.netBalance || 0)} />
          <SummaryStat label="Collection Rate" value={`${summary.collectionRate || 0}%`} />
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon={ClipboardList} title="Income vs Expense" />
        <div className="mt-4 h-72">
          {monthly.length === 0 ? (
            <Empty text="No analytics data yet." />
          ) : (
            <ResponsiveContainer height="100%" minHeight={0} minWidth={0} width="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
                <Bar dataKey="income" fill="var(--brand-600)" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="var(--danger)" name="Expense" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon={ClipboardList} title="Donation Trend" />
        <div className="mt-4 h-72">
          {donationTrend.length === 0 ? (
            <Empty text="No donation trend data yet." />
          ) : (
            <ResponsiveContainer height="100%" minHeight={0} minWidth={0} width="100%">
              <LineChart data={donationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
                <Line
                  activeDot={{ r: 6 }}
                  dataKey="donations"
                  name="Donations"
                  stroke="var(--success)"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon={ClipboardList} title="Expense Breakdown" />
        <div className="mt-4 h-72">
          {expenseBreakdown.length === 0 ? (
            <Empty text="No expense breakdown yet." />
          ) : (
            <ResponsiveContainer height="100%" minHeight={0} minWidth={0} width="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  dataKey="amount"
                  innerRadius={58}
                  nameKey="category"
                  outerRadius={92}
                  paddingAngle={2}
                >
                  {expenseBreakdown.map((item, index) => (
                    <Cell fill={pieColors[index % pieColors.length]} key={item.category} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      <Panel className="xl:col-span-2">
        <SectionTitle icon={ClipboardList} title="Current Month Overdue Fees" />
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SummaryStat label="Overdue Members" value={analytics?.overdue?.count || 0} />
          <SummaryStat label="Expected Collection" value={money(analytics?.overdue?.amount || 0)} />
          <SummaryStat label="This Month Income" value={money(analytics?.summary?.thisMonthIncome || 0)} />
          <SummaryStat
            label="Paid This Month"
            value={`${summary.paidThisMonth || 0}/${summary.totalMembers || 0}`}
          />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {overdueMembers.length === 0 ? <Empty text="No overdue members this month." /> : null}
          {overdueMembers.map((member) => (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3" key={member._id}>
              <p className="font-semibold text-gray-950">{member.name}</p>
              <p className="mt-1 text-sm text-gray-600">{member.phone}</p>
              <p className="mt-1 text-sm text-gray-600">{member.address}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function FinanceSummary({ expenseCategories, totalDonations, totalExpenses, totalPayments }) {
  const totalIncome = totalPayments + totalDonations
  const balance = totalIncome - totalExpenses
  const maxCategoryAmount = Math.max(...expenseCategories.map(([, amount]) => amount), 1)

  return (
    <Panel>
      <SectionTitle icon={ClipboardList} title="Finance Summary" />
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <SummaryStat label="Monthly Income" value={money(totalPayments)} />
        <SummaryStat label="Donations" value={money(totalDonations)} />
        <SummaryStat label="Expenses" value={money(totalExpenses)} />
        <SummaryStat label="Balance" value={money(balance)} />
      </div>
      <div className="mt-5 grid gap-3">
        <h3 className="text-sm font-bold uppercase text-gray-500">Expense Categories</h3>
        {expenseCategories.length === 0 ? <Empty text="No category data yet." /> : null}
        {expenseCategories.map(([category, amount]) => (
          <div className="grid gap-2" key={category}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-gray-700">{category}</span>
              <span className="font-bold text-gray-950">{money(amount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-700"
                style={{ width: `${Math.max((amount / maxCategoryAmount) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function OverdueMembersPanel({
  onAdjust,
  onHistory,
  onPaymentReject,
  onPaymentVerify,
  onReminder,
  onRemoveAdjustment,
  onRemoveWaiver,
  onWaive,
  overdueData,
}) {
  const members = useMemo(() => overdueData?.overdueMembers || [], [overdueData?.overdueMembers])
  const summary = overdueData?.summary || {}
  const [countFilter, setCountFilter] = useState('')
  const [expandedId, setExpandedId] = useState('')
  const [history, setHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyMember, setHistoryMember] = useState(null)
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear())
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [sortBy, setSortBy] = useState('amount')
  const [waiverModal, setWaiverModal] = useState(null)

  const collectionRate = summary.totalMembers
    ? Math.round((Number(summary.paidThisMonth || 0) / Number(summary.totalMembers || 1)) * 100)
    : 0
  const progressColor =
    collectionRate < 50 ? 'bg-red-500' : collectionRate < 80 ? 'bg-yellow-500' : 'bg-green-500'

  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const countMatches = (member) => {
      const count = member.overdueMonths?.length || 0
      if (countFilter === '1') return count === 1
      if (countFilter === '2-3') return count >= 2 && count <= 3
      if (countFilter === '4+') return count >= 4
      return true
    }
    const queryMatches = (member) =>
      normalizedQuery
        ? [member.name, member.phone]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery))
        : true

    return [...members]
      .filter((member) => countMatches(member) && queryMatches(member))
      .sort((left, right) => {
        if (sortBy === 'months') {
          return (right.overdueMonths?.length || 0) - (left.overdueMonths?.length || 0)
        }
        if (sortBy === 'name') {
          return String(left.name || '').localeCompare(String(right.name || ''))
        }
        if (sortBy === 'lastPaid') {
          return String(left.lastPaidMonth || '').localeCompare(String(right.lastPaidMonth || ''))
        }
        return Number(right.totalDuePaisa || 0) - Number(left.totalDuePaisa || 0)
      })
  }, [countFilter, members, query, sortBy])

  const selectedMembers = visibleMembers.filter((member) => selectedIds.includes(member.memberId))

  const toggleSelected = (memberId) => {
    setSelectedIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    )
  }

  const toggleAllVisible = () => {
    setSelectedIds((current) =>
      visibleMembers.every((member) => current.includes(member.memberId))
        ? current.filter((id) => !visibleMembers.some((member) => member.memberId === id))
        : [...new Set([...current, ...visibleMembers.map((member) => member.memberId)])],
    )
  }

  const exportSelected = () => {
    downloadCsv(
      'overdue-members.csv',
      selectedMembers.map((member) => ({
        phone: member.phone,
        member: member.name,
        overdueMonths: formatCoveredMonths(member.overdueMonths || []),
        totalDue: member.totalDue,
        lastPaidMonth: member.lastPaidMonth,
      })),
    )
  }

  const printSelected = () => {
    if (!selectedMembers.length) return

    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) return

    const rows = selectedMembers
      .map(
        (member) => `
          <tr>
            <td>${escapeHtml(member.name)}</td>
            <td>${escapeHtml(member.phone || '')}</td>
            <td>${escapeHtml(formatCoveredMonths(member.overdueMonths || []))}</td>
            <td>${escapeHtml(money(member.totalDue || 0))}</td>
          </tr>
        `,
      )
      .join('')

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Overdue Members</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: ${cssVar('--text-primary')}; }
            h1 { margin: 0 0 16px; font-size: 22px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid ${cssVar('--gray-200')}; padding: 10px; text-align: left; }
            th { background: ${cssVar('--surface-1')}; font-size: 12px; text-transform: uppercase; color: ${cssVar('--text-secondary')}; }
          </style>
        </head>
        <body>
          <h1>Dargah Para OIkko Porishod - Overdue Members</h1>
          <table>
            <thead><tr><th>Member</th><th>Phone</th><th>Months</th><th>Total due</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const sendSelectedReminders = async () => {
    for (const member of selectedMembers) {
      await onReminder(member)
    }
    setSelectedIds([])
  }

  const openHistory = async (member, year = new Date().getFullYear()) => {
    setHistoryMember(member)
    setHistoryYear(year)
    setHistoryLoading(true)
    setHistory(null)

    try {
      const response = await onHistory(member.memberId, year)
      setHistory(response.data.data)
    } finally {
      setHistoryLoading(false)
    }
  }

  const reloadHistory = async () => {
    if (historyMember) {
      await openHistory(historyMember, historyYear)
    }
  }

  const submitWaiver = async (event) => {
    event.preventDefault()
    const selectedMonth = waiverModal?.member?.overdueMonths?.find(
      (item) => `${item.month}-${item.year}` === waiverModal.monthKey,
    )

    if (!selectedMonth || !waiverModal?.reason?.trim()) {
      return
    }

    await onWaive({
      memberId: waiverModal.member.memberId,
      month: selectedMonth.month,
      reason: waiverModal.reason.trim(),
      year: selectedMonth.year,
    })
    setWaiverModal(null)
    await reloadHistory()
  }

  const removeWaiver = async (waiverId) => {
    await onRemoveWaiver(waiverId)
    await reloadHistory()
  }

  const adjustMonthAmount = async ({ member, month, year }) => {
    const amount = window.prompt(`${formatMonthYear(month, year)} fee amount (Tk)`)
    if (amount === null) return
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      window.alert('Enter a valid amount.')
      return
    }

    const reason = window.prompt('Adjustment reason')
    if (!reason?.trim()) return

    await onAdjust({
      amountPaisa: Math.round(numericAmount * 100),
      memberId: member.memberId,
      month,
      reason: reason.trim(),
      year,
    })
    await reloadHistory()
  }

  const removeAdjustment = async (adjustmentId) => {
    await onRemoveAdjustment(adjustmentId)
    await reloadHistory()
  }

  const handlePaymentAction = async (action, paymentId) => {
    await action(paymentId)
    await reloadHistory()
  }

  const downloadHistoryReceipt = async (paymentId) => {
    const response = await api.get(`/receipts/${paymentId}`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `fee-receipt-${paymentId}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={AlertTriangle} title="বকেয়া সদস্য তালিকা" />
        <Badge value={summary.totalOverdueMembers ? 'rejected' : 'verified'}>
          {summary.totalOverdueMembers || 0} জন বকেয়া
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <SummaryStat label="মোট বকেয়া সদস্য" value={summary.totalOverdueMembers || 0} />
        <SummaryStat label="মোট বকেয়া" value={money(summary.totalAmountDue || 0)} />
        <SummaryStat
          label="এই মাসে পরিশোধ"
          value={`${summary.paidThisMonth || 0}/${summary.totalMembers || 0}`}
        />
        <SummaryStat label="সংগ্রহ হার" value={`${collectionRate}%`} />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-gray-700">Monthly collection progress</span>
          <span className="font-bold text-gray-950">{collectionRate}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${collectionRate}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Field
          className="md:col-span-2"
          label="সদস্য খুঁজুন"
          name="overdueSearch"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="নাম বা ফোন"
          value={query}
        />
        <SelectField
          label="বকেয়া মাস"
          name="overdueCount"
          onChange={(event) => setCountFilter(event.target.value)}
          value={countFilter}
        >
          <option value="">সব</option>
          <option value="1">১ মাস</option>
          <option value="2-3">২-৩ মাস</option>
          <option value="4+">৪+ মাস</option>
        </SelectField>
        <SelectField
          label="সাজান"
          name="overdueSort"
          onChange={(event) => setSortBy(event.target.value)}
          value={sortBy}
        >
          <option value="amount">সবচেয়ে বেশি টাকা</option>
          <option value="months">সবচেয়ে বেশি মাস</option>
          <option value="name">নাম</option>
          <option value="lastPaid">শেষ পেমেন্ট</option>
        </SelectField>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={!selectedMembers.length} icon={MessageCircle} onClick={sendSelectedReminders}>
          SMS পাঠান
        </Button>
        <Button
          disabled={!selectedMembers.length}
          icon={FileDown}
          onClick={exportSelected}
          variant="secondary"
        >
          CSV Export
        </Button>
        <Button
          disabled={!selectedMembers.length}
          icon={FileText}
          onClick={printSelected}
          variant="secondary"
        >
          PDF/Print
        </Button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3">
                <input
                  checked={
                    visibleMembers.length > 0 &&
                    visibleMembers.every((member) => selectedIds.includes(member.memberId))
                  }
                  className="h-4 w-4 accent-indigo-600"
                  onChange={toggleAllVisible}
                  type="checkbox"
                />
              </th>
              {['সদস্য', 'ফোন', 'বকেয়া মাস', 'মোট বকেয়া', 'শেষ পেমেন্ট', 'অ্যাকশন'].map(
                (heading) => (
                  <th
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
                    key={heading}
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleMembers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={7}>
                  No overdue members found.
                </td>
              </tr>
            ) : null}
            {visibleMembers.map((member) => {
              const isExpanded = expandedId === member.memberId
              return (
                <Fragment key={member.memberId}>
                  <tr className="transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        checked={selectedIds.includes(member.memberId)}
                        className="h-4 w-4 accent-indigo-600"
                        onChange={() => toggleSelected(member.memberId)}
                        type="checkbox"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} size="sm" src={member.photo} />
                        <div>
                          <p className="font-semibold text-gray-950">{member.name}</p>
                          <p className="text-xs text-gray-500">
                            Since {toDateInput(member.memberSince) || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{member.phone}</td>
                    <td className="px-4 py-3">
                      <button
                        className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                        onClick={() => setExpandedId(isExpanded ? '' : member.memberId)}
                        type="button"
                      >
                        {member.overdueMonths?.length || 0} মাস
                      </button>
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">{money(member.totalDue || 0)}</td>
                    <td className="px-4 py-3 text-gray-600">{member.lastPaidMonth || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button icon={MessageCircle} onClick={() => onReminder(member)} variant="secondary">
                          SMS
                        </Button>
                        <Button
                          icon={CheckCircle2}
                          onClick={() =>
                            setWaiverModal({
                              member,
                              monthKey: `${member.overdueMonths?.[0]?.month}-${member.overdueMonths?.[0]?.year}`,
                              reason: '',
                            })
                          }
                          variant="secondary"
                        >
                          মওকুফ
                        </Button>
                        <Button icon={Eye} onClick={() => openHistory(member)} variant="secondary">
                          বিস্তারিত
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr>
                      <td className="bg-red-50/50 px-4 py-3" colSpan={7}>
                        <div className="flex flex-wrap gap-2">
                          {(member.overdueMonths || []).map((item) => (
                            <Badge key={`${item.month}-${item.year}`} value="rejected">
                              {formatMonthYear(item.month, item.year)} - {money(item.amount)}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal
        className="max-w-lg"
        onClose={() => setWaiverModal(null)}
        open={Boolean(waiverModal)}
        title="ফি মওকুফ করুন"
      >
        {waiverModal ? (
          <form className="grid gap-4" onSubmit={submitWaiver}>
            <p className="text-sm text-gray-600">
              {waiverModal.member.name} এর নির্দিষ্ট মাসের ফি মওকুফ করতে কারণ লিখুন।
            </p>
            <SelectField
              label="মাস"
              name="waiverMonth"
              onChange={(event) =>
                setWaiverModal((current) => ({ ...current, monthKey: event.target.value }))
              }
              value={waiverModal.monthKey}
            >
              {(waiverModal.member.overdueMonths || []).map((item) => (
                <option key={`${item.month}-${item.year}`} value={`${item.month}-${item.year}`}>
                  {formatMonthYear(item.month, item.year)} - {money(item.amount)}
                </option>
              ))}
            </SelectField>
            <Field
              label="কারণ"
              name="waiverReason"
              onChange={(event) =>
                setWaiverModal((current) => ({ ...current, reason: event.target.value }))
              }
              required
              textarea
              value={waiverModal.reason}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setWaiverModal(null)} variant="secondary">
                বাতিল
              </Button>
              <Button icon={CheckCircle2} type="submit">
                সংরক্ষণ
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        className="max-h-[90vh] max-w-6xl overflow-y-auto"
        onClose={() => {
          setHistoryMember(null)
          setHistory(null)
        }}
        open={Boolean(historyMember)}
        title="সদস্যের ফি ইতিহাস"
      >
        {historyLoading ? <Skeleton rows={6} /> : null}
        {!historyLoading && history ? (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={history.member?.name} src={history.member?.profilePhotoUrl} />
                <div>
                  <p className="font-semibold text-gray-950">{history.member?.name}</p>
                  <p className="text-sm text-gray-500">{history.member?.phone}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(history.years || []).map((year) => (
                  <button
                    className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${
                      Number(year) === Number(historyYear)
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-700'
                    }`}
                    key={year}
                    onClick={() => openHistory(historyMember, year)}
                    type="button"
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(history.grid || []).map((cell) => (
                <div
                  className={`rounded-xl border p-3 ${
                    cell.status === 'approved'
                      ? 'border-green-200 bg-green-50'
                      : cell.status === 'pending'
                        ? 'border-yellow-200 bg-yellow-50'
                        : cell.status === 'overdue'
                          ? 'border-red-200 bg-red-50'
                          : cell.status === 'waived'
                            ? 'border-gray-300 bg-gray-100'
                            : 'border-gray-200 bg-white'
                  }`}
                  key={`${cell.month}-${cell.year}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-950">{cell.label}</p>
                    <Badge
                      value={
                        cell.status === 'approved'
                          ? 'verified'
                          : cell.status === 'pending'
                            ? 'pending'
                            : cell.status === 'overdue'
                              ? 'rejected'
                              : 'default'
                      }
                    >
                      {cell.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-bold text-gray-900">
                    {cell.amountPaisa ? moneyPaisa(cell.amountPaisa) : money(cell.amount)}
                  </p>
                  {cell.adjustment?._id ? (
                    <p className="mt-1 text-xs font-semibold text-indigo-700">
                      Adjusted: {cell.adjustment.reason}
                    </p>
                  ) : null}
                  {cell.payment?.status === 'pending' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        onClick={() => handlePaymentAction(onPaymentVerify, cell.payment._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handlePaymentAction(onPaymentReject, cell.payment._id)}
                        variant="danger"
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                  {cell.status === 'overdue' ? (
                    <div className="mt-3 grid gap-2">
                      <Button
                        onClick={() =>
                          setWaiverModal({
                            member: historyMember,
                            monthKey: `${cell.month}-${cell.year}`,
                            reason: '',
                          })
                        }
                        variant="secondary"
                      >
                        মওকুফ
                      </Button>
                      <Button
                        onClick={() =>
                          adjustMonthAmount({
                            member: historyMember,
                            month: cell.month,
                            year: cell.year,
                          })
                        }
                        variant="secondary"
                      >
                        টাকা সেট
                      </Button>
                    </div>
                  ) : null}
                  {cell.adjustment?._id ? (
                    <Button
                      className="mt-3 w-full"
                      onClick={() => removeAdjustment(cell.adjustment._id)}
                      variant="danger"
                    >
                      সমন্বয় বাতিল
                    </Button>
                  ) : null}
                  {cell.waiver?._id ? (
                    <Button
                      className="mt-3 w-full"
                      onClick={() => removeWaiver(cell.waiver._id)}
                      variant="danger"
                    >
                      মওকুফ বাতিল
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['তারিখ', 'মাসসমূহ', 'পরিমাণ', 'বিলম্ব ফি', 'অবস্থা', 'রসিদ'].map(
                      (heading) => (
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500" key={heading}>
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(history.payments || []).map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-4 py-3 text-gray-600">{toReadableDate(payment.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatCoveredMonths(payment.coveredMonths || [])}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-950">
                        {payment.amountPaisa ? moneyPaisa(payment.amountPaisa) : money(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {payment.lateFeeAppliedPaisa
                          ? moneyPaisa(payment.lateFeeAppliedPaisa)
                          : money(payment.lateFeeApplied || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={payment.status}>{payment.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {payment.status === 'verified' ? (
                          <Button
                            icon={Download}
                            onClick={() => downloadHistoryReceipt(payment._id)}
                            variant="secondary"
                          >
                            PDF
                          </Button>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </Panel>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-gray-950">{value}</p>
    </div>
  )
}

function ContentTab({
  contentForms,
  data,
  editingContent,
  onCancelEdit,
  onCreate,
  onDelete,
  onEdit,
  onFormChange,
  onImageUpload,
  onPollChange,
  onPollCreate,
  onSaveMeetingAttendance,
  onSaveTourParticipants,
  pollForm,
  uploadingContentKey,
}) {
  const approvedMembers = data.users.filter(
    (item) => item.role === 'member' && item.status === 'approved',
  )

  return (
    <div className="mt-6 grid gap-6">
      {contentConfigs.map((config) => (
        <Panel key={config.key}>
          <SectionTitle
            icon={FilePlus2}
            title={editingContent[config.key] ? `Edit ${config.title}` : config.title}
          />
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={(event) => onCreate(event, config)}>
            <ContentFields
              config={config}
              form={contentForms[config.key]}
              onChange={onFormChange}
              onImageUpload={onImageUpload}
              uploading={uploadingContentKey === config.key}
            />
            <Button className={editingContent[config.key] ? '' : 'md:col-span-2'} icon={FilePlus2} type="submit">
              {editingContent[config.key] ? `Update ${config.title}` : `Add ${config.title}`}
            </Button>
            {editingContent[config.key] ? (
              <Button onClick={() => onCancelEdit(config)} variant="secondary">
                Cancel Edit
              </Button>
            ) : null}
          </form>
          <div className="mt-5 grid gap-3">
            {data.content[config.key].length === 0 ? <Empty text={`No ${config.title.toLowerCase()}.`} /> : null}
            {data.content[config.key].map((item) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-200 p-4"
                key={item._id}
              >
                <div>
                  {item.imageUrl ? (
                    <img
                      alt=""
                      className="mb-3 h-32 w-full max-w-sm rounded-md object-cover"
                      src={item.imageUrl}
                    />
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-950">{item.title}</h3>
                    {item.audience ? <Badge value={item.audience}>{item.audience}</Badge> : null}
                    {item.status ? <Badge value={item.status}>{item.status}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{item[config.main]}</p>
                  {['meetings', 'tours'].includes(config.key) ? (
                    <RsvpSummary members={approvedMembers} rsvp={item.rsvp || []} />
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button icon={Pencil} onClick={() => onEdit(config, item)} variant="secondary">
                    Edit
                  </Button>
                  <Button icon={Trash2} onClick={() => onDelete(config, item._id)} variant="danger">
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {config.key === 'meetings' ? (
            <div className="mt-5 grid gap-5">
              <MeetingWorkflowPanel
                meetings={data.content.meetings}
                members={approvedMembers}
                onSave={onSaveMeetingAttendance}
              />
              <PollWorkflowPanel
                meetings={data.content.meetings}
                onChange={onPollChange}
                onCreate={onPollCreate}
                pollForm={pollForm}
                polls={data.polls}
              />
            </div>
          ) : null}
          {config.key === 'tours' ? (
            <TourWorkflowPanel
              members={approvedMembers}
              onSave={onSaveTourParticipants}
              tours={data.content.tours}
            />
          ) : null}
        </Panel>
      ))}
    </div>
  )
}

function MeetingWorkflowPanel({ meetings, members, onSave }) {
  const [selectedMeetingId, setSelectedMeetingId] = useState('')
  const [minutes, setMinutes] = useState('')
  const [attendance, setAttendance] = useState({})

  const selectMeeting = (id) => {
    const meeting = meetings.find((item) => item._id === id)
    const rows = {}

    members.forEach((member) => {
      const existing = meeting?.attendance?.find(
        (item) => String(item.member?._id || item.member) === member._id,
      )
      rows[member._id] = {
        note: existing?.note || '',
        status: existing?.status || 'absent',
      }
    })

    setSelectedMeetingId(id)
    setMinutes(meeting?.minutes || '')
    setAttendance(rows)
  }

  const updateAttendance = (memberId, field, value) => {
    setAttendance((current) => ({
      ...current,
      [memberId]: {
        ...current[memberId],
        [field]: value,
      },
    }))
  }

  const saveAttendance = async (event) => {
    event.preventDefault()

    await onSave(selectedMeetingId, {
      attendance: Object.entries(attendance).map(([member, row]) => ({
        member,
        note: row.note,
        status: row.status,
      })),
      minutes,
    })
  }

  return (
    <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4">
      <h3 className="font-bold text-gray-950">Meeting Attendance</h3>
      <form className="mt-4 grid gap-4" onSubmit={saveAttendance}>
        <SelectField
          label="Meeting"
          name="meeting"
          onChange={(event) => selectMeeting(event.target.value)}
          value={selectedMeetingId}
        >
          <option value="">Select meeting</option>
          {meetings.map((meeting) => (
            <option key={meeting._id} value={meeting._id}>
              {meeting.title}
            </option>
          ))}
        </SelectField>
        {selectedMeetingId ? (
          <>
            <Field
              label="Minutes"
              name="minutes"
              onChange={(event) => setMinutes(event.target.value)}
              textarea
              value={minutes}
            />
            <div className="grid gap-3">
              {members.map((member) => (
                <div
                  className="grid gap-3 rounded-md border border-gray-200 bg-white p-3 md:grid-cols-[1fr_160px_1fr]"
                  key={member._id}
                >
                  <div>
                    <p className="font-semibold text-gray-950">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.phone}</p>
                  </div>
                  <SelectField
                    label="Status"
                    name={`status-${member._id}`}
                    onChange={(event) =>
                      updateAttendance(member._id, 'status', event.target.value)
                    }
                    value={attendance[member._id]?.status || 'absent'}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </SelectField>
                  <Field
                    label="Note"
                    name={`note-${member._id}`}
                    onChange={(event) => updateAttendance(member._id, 'note', event.target.value)}
                    value={attendance[member._id]?.note || ''}
                  />
                </div>
              ))}
            </div>
            <Button icon={Save} type="submit">
              Save Attendance
            </Button>
          </>
        ) : null}
      </form>
    </div>
  )
}

function PollWorkflowPanel({ meetings, onChange, onCreate, pollForm, polls }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
      <SectionTitle icon={Vote} title="Meeting Polls" />
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onCreate}>
        <SelectField
          label="Meeting"
          name="pollMeeting"
          onChange={(event) => onChange('meetingId', event.target.value)}
          required
          value={pollForm.meetingId}
        >
          <option value="">Select meeting</option>
          {meetings.map((meeting) => (
            <option key={meeting._id} value={meeting._id}>
              {meeting.title}
            </option>
          ))}
        </SelectField>
        <Field
          label="Deadline"
          name="pollDeadline"
          onChange={(event) => onChange('deadline', event.target.value)}
          required
          type="datetime-local"
          value={pollForm.deadline}
        />
        <Field
          className="md:col-span-2"
          label="Question"
          name="pollQuestion"
          onChange={(event) => onChange('question', event.target.value)}
          required
          value={pollForm.question}
        />
        <Field
          className="md:col-span-2"
          label="Options"
          name="pollOptions"
          onChange={(event) => onChange('optionsText', event.target.value)}
          required
          textarea
          value={pollForm.optionsText}
        />
        <Button className="md:col-span-2" icon={Vote} type="submit">
          Create Poll
        </Button>
      </form>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {polls.length === 0 ? <Empty text="No polls created yet." /> : null}
        {polls.map((poll) => (
          <div className="rounded-md border border-gray-200 bg-white p-4" key={poll._id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-950">{poll.question}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {poll.meetingId?.title || 'Meeting'} | Deadline {toReadableDate(poll.deadline)}
                </p>
              </div>
              <Badge value={poll.isClosed ? 'rejected' : 'approved'}>
                {poll.isClosed ? 'Closed' : 'Open'}
              </Badge>
            </div>
            <PollResultsChart poll={poll} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PollResultsChart({ poll }) {
  const rows = poll.options.map((option) => ({
    name: option.text,
    votes: option.voteCount,
  }))

  return (
    <div className="mt-4 h-56">
      <ResponsiveContainer height="100%" minHeight={0} minWidth={0} width="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="votes" fill="var(--brand-600)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RsvpSummary({ members, rsvp }) {
  const memberById = new Map(members.map((member) => [member._id, member]))
  const counts = rsvp.reduce(
    (summary, row) => ({
      ...summary,
      [row.status]: (summary[row.status] || 0) + 1,
    }),
    { going: 0, maybe: 0, not_going: 0 },
  )

  return (
    <div className="mt-3 rounded-md bg-gray-50 p-3">
      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-gray-600">
        <span>Going: {counts.going}</span>
        <span>Maybe: {counts.maybe}</span>
        <span>Not going: {counts.not_going}</span>
      </div>
      {rsvp.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {rsvp.map((row) => {
            const memberId = row.memberId?._id || row.memberId
            const member = memberById.get(String(memberId))

            return (
              <Badge key={`${memberId}-${row.status}`} value={row.status}>
                {member?.name || 'Member'}: {row.status.replace('_', ' ')}
              </Badge>
            )
          })}
        </div>
      ) : (
        <p className="mt-2 text-xs font-semibold text-gray-500">No RSVP responses yet.</p>
      )}
    </div>
  )
}

function TourWorkflowPanel({ members, onSave, tours }) {
  const [selectedTourId, setSelectedTourId] = useState('')
  const [participants, setParticipants] = useState({})

  const selectTour = (id) => {
    const tour = tours.find((item) => item._id === id)
    const rows = {}

    members.forEach((member) => {
      const existing = tour?.participants?.find(
        (item) => String(item.member?._id || item.member) === member._id,
      )
      rows[member._id] = {
        amountDue: existing?.amountDue || '',
        note: existing?.note || '',
        paidAmount: existing?.paidAmount || '',
        status: existing?.status || '',
      }
    })

    setSelectedTourId(id)
    setParticipants(rows)
  }

  const updateParticipant = (memberId, field, value) => {
    setParticipants((current) => ({
      ...current,
      [memberId]: {
        ...current[memberId],
        [field]: value,
      },
    }))
  }

  const saveParticipants = async (event) => {
    event.preventDefault()

    await onSave(selectedTourId, {
      participants: Object.entries(participants)
        .filter(([, row]) => row.status)
        .map(([member, row]) => ({
          amountDue: row.amountDue || 0,
          member,
          note: row.note,
          paidAmount: row.paidAmount || 0,
          status: row.status,
        })),
    })
  }

  const totalDue = Object.values(participants).reduce(
    (sum, row) => sum + Number(row.amountDue || 0),
    0,
  )
  const totalPaid = Object.values(participants).reduce(
    (sum, row) => sum + Number(row.paidAmount || 0),
    0,
  )

  return (
    <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4">
      <h3 className="font-bold text-gray-950">Tour Participants</h3>
      <form className="mt-4 grid gap-4" onSubmit={saveParticipants}>
        <SelectField
          label="Tour"
          name="tour"
          onChange={(event) => selectTour(event.target.value)}
          value={selectedTourId}
        >
          <option value="">Select tour</option>
          {tours.map((tour) => (
            <option key={tour._id} value={tour._id}>
              {tour.title}
            </option>
          ))}
        </SelectField>
        {selectedTourId ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <SummaryStat label="Total Due" value={money(totalDue)} />
              <SummaryStat label="Total Paid" value={money(totalPaid)} />
            </div>
            <div className="grid gap-3">
              {members.map((member) => (
                <div
                  className="grid gap-3 rounded-md border border-gray-200 bg-white p-3 md:grid-cols-[1fr_150px_120px_120px_1fr]"
                  key={member._id}
                >
                  <div>
                    <p className="font-semibold text-gray-950">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.phone}</p>
                  </div>
                  <SelectField
                    label="Status"
                    name={`tour-status-${member._id}`}
                    onChange={(event) =>
                      updateParticipant(member._id, 'status', event.target.value)
                    }
                    value={participants[member._id]?.status || ''}
                  >
                    <option value="">Not going</option>
                    <option value="interested">Interested</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </SelectField>
                  <Field
                    label="Due"
                    name={`amountDue-${member._id}`}
                    onChange={(event) =>
                      updateParticipant(member._id, 'amountDue', event.target.value)
                    }
                    type="number"
                    value={participants[member._id]?.amountDue || ''}
                  />
                  <Field
                    label="Paid"
                    name={`paidAmount-${member._id}`}
                    onChange={(event) =>
                      updateParticipant(member._id, 'paidAmount', event.target.value)
                    }
                    type="number"
                    value={participants[member._id]?.paidAmount || ''}
                  />
                  <Field
                    label="Note"
                    name={`tour-note-${member._id}`}
                    onChange={(event) =>
                      updateParticipant(member._id, 'note', event.target.value)
                    }
                    value={participants[member._id]?.note || ''}
                  />
                </div>
              ))}
            </div>
            <Button icon={Save} type="submit">
              Save Participants
            </Button>
          </>
        ) : null}
      </form>
    </div>
  )
}

function MembersTab({ onDeleteUser, onResetPassword, onUpdateAccess, onUpdateProfile, payments, users }) {
  const [editingUserId, setEditingUserId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [query, setQuery] = useState('')
  const [feeStatusFilter, setFeeStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('joinDate')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [memberForm, setMemberForm] = useState({
    address: '',
    birthCertificateUrl: '',
    name: '',
    nidImageUrl: '',
    phone: '',
    profilePhotoUrl: '',
    role: 'member',
    status: 'pending',
  })

  const startEdit = (user) => {
    setEditingUserId(user._id)
    setNewPassword('')
    setMemberForm({
      address: user.address || '',
      birthCertificateUrl: user.birthCertificateUrl || '',
      name: user.name || '',
      nidImageUrl: user.nidImageUrl || '',
      phone: user.phone || '',
      profilePhotoUrl: user.profilePhotoUrl || '',
      role: user.role || 'member',
      status: user.status || 'pending',
    })
  }

  const cancelEdit = () => {
    setEditingUserId(null)
    setNewPassword('')
    setMemberForm({
      address: '',
      birthCertificateUrl: '',
      name: '',
      nidImageUrl: '',
      phone: '',
      profilePhotoUrl: '',
      role: 'member',
      status: 'pending',
    })
  }

  const updateField = (field, value) => {
    setMemberForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const saveMember = async (event) => {
    event.preventDefault()

    await onUpdateProfile(editingUserId, {
      address: memberForm.address,
      birthCertificateUrl: memberForm.birthCertificateUrl,
      name: memberForm.name,
      nidImageUrl: memberForm.nidImageUrl,
      phone: memberForm.phone,
      profilePhotoUrl: memberForm.profilePhotoUrl,
    })
    await onUpdateAccess(editingUserId, {
      role: memberForm.role,
      status: memberForm.status,
    })
    cancelEdit()
  }

  const resetPassword = async () => {
    if (!newPassword) {
      return
    }

    await onResetPassword(editingUserId, newPassword)
    setNewPassword('')
  }

  const normalizedQuery = query.trim().toLowerCase()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const paymentStats = useMemo(() => {
    const statsByUser = new Map()

    payments.forEach((payment) => {
      const userId = payment.user?._id || payment.user

      if (!userId) {
        return
      }

      const current = statsByUser.get(userId) || {
        currentMonthStatus: '',
        lastPaymentAt: '',
        totalPaid: 0,
      }

      if (payment.status === 'verified') {
        current.totalPaid += Number(payment.amount || 0)
        const paidAt = payment.verifiedAt || payment.createdAt

        if (paidAt && (!current.lastPaymentAt || new Date(paidAt) > new Date(current.lastPaymentAt))) {
          current.lastPaymentAt = paidAt
        }
      }

      if (payment.month === currentMonth && ['pending', 'verified'].includes(payment.status)) {
        current.currentMonthStatus = payment.status === 'verified' ? 'paid' : 'pending'
      }

      statsByUser.set(userId.toString(), current)
    })

    return statsByUser
  }, [currentMonth, payments])
  const visibleUsers = users
    .filter((item) => {
    const memberStats = paymentStats.get(item._id) || {}
    const feeStatus =
      memberStats.currentMonthStatus || (item.status === 'approved' ? 'overdue' : 'not_applicable')
    const matchesStatus =
      statusFilter === 'suspended'
        ? Boolean(item.suspendedAt)
        : statusFilter
          ? item.status === statusFilter
          : true
    const matchesRole = roleFilter ? item.role === roleFilter : true
    const matchesFee = feeStatusFilter ? feeStatus === feeStatusFilter : true
    const matchesQuery = normalizedQuery
      ? [item._id, item.name, item.phone, item.address, item.role, item.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))
      : true

    return matchesStatus && matchesRole && matchesFee && matchesQuery
  })
    .sort((left, right) => {
      const leftStats = paymentStats.get(left._id) || {}
      const rightStats = paymentStats.get(right._id) || {}

      if (sortBy === 'name') {
        return left.name.localeCompare(right.name)
      }

      if (sortBy === 'lastPayment') {
        return new Date(rightStats.lastPaymentAt || 0) - new Date(leftStats.lastPaymentAt || 0)
      }

      if (sortBy === 'totalPaid') {
        return Number(rightStats.totalPaid || 0) - Number(leftStats.totalPaid || 0)
      }

      return new Date(right.approvedAt || right.createdAt || 0) - new Date(left.approvedAt || left.createdAt || 0)
    })
  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / 20))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = visibleUsers.slice((currentPage - 1) * 20, currentPage * 20)
  const getMemberPaymentStats = (member) => {
    const memberStats = paymentStats.get(member._id) || {}
    const feeStatus =
      memberStats.currentMonthStatus || (member.status === 'approved' ? 'overdue' : 'not_applicable')

    return {
      feeStatus,
      lastPaymentAt: memberStats.lastPaymentAt || '',
      totalPaid: memberStats.totalPaid || 0,
    }
  }
  const getFeeBadgeValue = (feeStatus) =>
    feeStatus === 'paid' ? 'approved' : feeStatus === 'pending' ? 'pending' : 'rejected'

  return (
    <div className="mt-6 grid gap-6">
      {editingUserId ? (
        <Panel>
          <SectionTitle icon={Pencil} title="Edit User" />
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={saveMember}>
            <Field
              label="Name"
              name="name"
              onChange={(event) => updateField('name', event.target.value)}
              required
              value={memberForm.name}
            />
            <Field
              label="Phone"
              name="phone"
              onChange={(event) => updateField('phone', event.target.value)}
              required
              value={memberForm.phone}
            />
            <Field
              className="md:col-span-2"
              label="Address"
              name="address"
              onChange={(event) => updateField('address', event.target.value)}
              value={memberForm.address}
            />
            <SelectField
              label="Role"
              name="role"
              onChange={(event) => updateField('role', event.target.value)}
              value={memberForm.role}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </SelectField>
            <SelectField
              label="Status"
              name="status"
              onChange={(event) => updateField('status', event.target.value)}
              value={memberForm.status}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </SelectField>
            <Field
              label="Profile Photo URL"
              name="profilePhotoUrl"
              onChange={(event) => updateField('profilePhotoUrl', event.target.value)}
              value={memberForm.profilePhotoUrl}
            />
            <Field
              label="NID Image URL"
              name="nidImageUrl"
              onChange={(event) => updateField('nidImageUrl', event.target.value)}
              value={memberForm.nidImageUrl}
            />
            <Field
              className="md:col-span-2"
              label="Birth Certificate URL"
              name="birthCertificateUrl"
              onChange={(event) => updateField('birthCertificateUrl', event.target.value)}
              value={memberForm.birthCertificateUrl}
            />
            <Button icon={Save} type="submit">
              Save User
            </Button>
            <Button onClick={cancelEdit} variant="secondary">
              Cancel
            </Button>
          </form>
          <div className="mt-5 grid gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_auto]">
            <Field
              label="New Password"
              name="newPassword"
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              value={newPassword}
            />
            <div className="flex items-end">
              <Button
                disabled={!newPassword}
                icon={KeyRound}
                onClick={resetPassword}
                variant="secondary"
              >
                Reset Password
              </Button>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle icon={ClipboardList} title="সদস্য ব্যবস্থাপনা" />
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-600'
              }`}
              onClick={() => setViewMode('grid')}
              type="button"
            >
              Grid
            </button>
            <button
              className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-gray-600'
              }`}
              onClick={() => setViewMode('table')}
              type="button"
            >
              Table
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field
            className="min-w-64 flex-1"
            label="সদস্য খুঁজুন"
            name="memberSearch"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="নাম, ফোন, ঠিকানা, ভূমিকা"
            value={query}
          />
          <SelectField
            className="min-w-48"
            label="স্ট্যাটাস"
            name="memberStatusFilter"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="">সব</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </SelectField>
          <SelectField
            className="min-w-48"
            label="Role"
            name="memberRoleFilter"
            onChange={(event) => setRoleFilter(event.target.value)}
            value={roleFilter}
          >
            <option value="">All roles</option>
            <option value="member">Member</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </SelectField>
          <SelectField
            className="min-w-48"
            label="Fee status"
            name="memberFeeStatusFilter"
            onChange={(event) => setFeeStatusFilter(event.target.value)}
            value={feeStatusFilter}
          >
            <option value="">All fee statuses</option>
            <option value="paid">Paid this month</option>
            <option value="pending">Pending this month</option>
            <option value="overdue">Overdue</option>
          </SelectField>
          <SelectField
            className="min-w-48"
            label="Sort"
            name="memberSort"
            onChange={(event) => setSortBy(event.target.value)}
            value={sortBy}
          >
            <option value="joinDate">Join date</option>
            <option value="name">Name</option>
            <option value="lastPayment">Last payment</option>
            <option value="totalPaid">Total paid</option>
          </SelectField>
        </div>

        {viewMode === 'grid' ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedUsers.map((item) => (
              <div
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                key={item._id}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={item.name} src={item.profilePhotoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-gray-900">{item.name}</h3>
                      <Badge value={item.status}>{item.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{item.phone}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.address}</p>
                    <p className="mt-2 text-xs font-semibold uppercase text-indigo-600">
                      {item.role}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <Badge value={getFeeBadgeValue(getMemberPaymentStats(item).feeStatus)}>
                        {getMemberPaymentStats(item).feeStatus}
                      </Badge>
                      <span className="rounded-full bg-gray-50 px-2.5 py-1 text-gray-600">
                        Paid {money(getMemberPaymentStats(item).totalPaid)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Joined {toDate(item.approvedAt || item.createdAt)} | Last payment{' '}
                      {toDate(getMemberPaymentStats(item).lastPaymentAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button icon={Pencil} onClick={() => startEdit(item)} variant="secondary">
                    Edit
                  </Button>
                  <Button icon={Trash2} onClick={() => onDeleteUser(item._id)} variant="danger">
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['নাম', 'ফোন', 'ভূমিকা', 'স্ট্যাটাস', 'ঠিকানা', 'অ্যাকশন'].map((heading) => (
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers.map((item) => (
                  <tr className="transition hover:bg-gray-50" key={item._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Avatar name={item.name} src={item.profilePhotoUrl} size="sm" />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.role}</td>
                    <td className="px-4 py-3">
                      <Badge value={item.status}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.address}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button icon={Pencil} onClick={() => startEdit(item)} variant="secondary">
                          Edit
                        </Button>
                        <Button icon={Trash2} onClick={() => onDeleteUser(item._id)} variant="danger">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
          <span>
            Showing {visibleUsers.length ? (currentPage - 1) * 20 + 1 : 0}-
            {Math.min(currentPage * 20, visibleUsers.length)} of {visibleUsers.length}
          </span>
          <div className="flex gap-2">
            <Button
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              variant="secondary"
            >
              Previous
            </Button>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </div>
        {visibleUsers.length === 0 ? <Empty text="No matching users found." /> : null}
      </Panel>
    </div>
  )
}

function ImageUploadControl({ form, itemKey, onChange, onImageUpload, uploading }) {
  return (
    <div className="grid gap-3 md:col-span-2">
      <Field
        label="Image URL"
        name="imageUrl"
        onChange={(event) => onChange(itemKey, 'imageUrl', event.target.value)}
        value={form.imageUrl}
      />
      <label className="grid gap-1.5 text-sm font-medium text-gray-700">
        <span>Upload Image</span>
        <input
          accept="image/*"
          className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
          disabled={uploading}
          onChange={(event) => onImageUpload(itemKey, event.target.files?.[0])}
          type="file"
        />
      </label>
      {uploading ? <p className="text-sm font-medium text-indigo-700">Uploading image...</p> : null}
    </div>
  )
}

function ContentFields({ config, form, onChange, onImageUpload, uploading }) {
  const key = config.key

  if (key === 'notices') {
    return (
      <>
        <Field label="Title" name="title" onChange={(e) => onChange(key, 'title', e.target.value)} required value={form.title} />
        <SelectField label="Audience" name="audience" onChange={(e) => onChange(key, 'audience', e.target.value)} value={form.audience}>
          <option value="public">Public</option>
          <option value="members">Members</option>
        </SelectField>
        <ImageUploadControl
          form={form}
          itemKey={key}
          onChange={onChange}
          onImageUpload={onImageUpload}
          uploading={uploading}
        />
        <Field className="md:col-span-2" label="Body" name="body" onChange={(e) => onChange(key, 'body', e.target.value)} required textarea value={form.body} />
      </>
    )
  }

  if (key === 'meetings') {
    return (
      <>
        <Field label="Title" name="title" onChange={(e) => onChange(key, 'title', e.target.value)} required value={form.title} />
        <Field label="Date" name="meetingDate" onChange={(e) => onChange(key, 'meetingDate', e.target.value)} required type="datetime-local" value={form.meetingDate} />
        <Field label="Location" name="location" onChange={(e) => onChange(key, 'location', e.target.value)} required value={form.location} />
        <SelectField label="Audience" name="audience" onChange={(e) => onChange(key, 'audience', e.target.value)} value={form.audience}>
          <option value="public">Public</option>
          <option value="members">Members</option>
        </SelectField>
        <ImageUploadControl
          form={form}
          itemKey={key}
          onChange={onChange}
          onImageUpload={onImageUpload}
          uploading={uploading}
        />
        <Field className="md:col-span-2" label="Agenda" name="agenda" onChange={(e) => onChange(key, 'agenda', e.target.value)} required textarea value={form.agenda} />
      </>
    )
  }

  if (key === 'tours') {
    return (
      <>
        <Field label="Title" name="title" onChange={(e) => onChange(key, 'title', e.target.value)} required value={form.title} />
        <Field label="Destination" name="destination" onChange={(e) => onChange(key, 'destination', e.target.value)} required value={form.destination} />
        <Field label="Start Date" name="startDate" onChange={(e) => onChange(key, 'startDate', e.target.value)} required type="date" value={form.startDate} />
        <Field label="End Date" name="endDate" onChange={(e) => onChange(key, 'endDate', e.target.value)} required type="date" value={form.endDate} />
        <Field label="Budget" name="budget" onChange={(e) => onChange(key, 'budget', e.target.value)} type="number" value={form.budget} />
        <SelectField label="Status" name="status" onChange={(e) => onChange(key, 'status', e.target.value)} value={form.status}>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </SelectField>
        <ImageUploadControl
          form={form}
          itemKey={key}
          onChange={onChange}
          onImageUpload={onImageUpload}
          uploading={uploading}
        />
        <Field className="md:col-span-2" label="Details" name="details" onChange={(e) => onChange(key, 'details', e.target.value)} textarea value={form.details} />
      </>
    )
  }

  if (key === 'activities') {
    return (
      <>
        <Field label="Title" name="title" onChange={(e) => onChange(key, 'title', e.target.value)} required value={form.title} />
        <Field label="Category" name="category" onChange={(e) => onChange(key, 'category', e.target.value)} required value={form.category} />
        <Field label="Date" name="activityDate" onChange={(e) => onChange(key, 'activityDate', e.target.value)} required type="date" value={form.activityDate} />
        <Field label="Participants" name="participantsCount" onChange={(e) => onChange(key, 'participantsCount', e.target.value)} type="number" value={form.participantsCount} />
        <SelectField label="Audience" name="audience" onChange={(e) => onChange(key, 'audience', e.target.value)} value={form.audience}>
          <option value="public">Public</option>
          <option value="members">Members</option>
        </SelectField>
        <SelectField label="Status" name="status" onChange={(e) => onChange(key, 'status', e.target.value)} value={form.status}>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </SelectField>
        <ImageUploadControl
          form={form}
          itemKey={key}
          onChange={onChange}
          onImageUpload={onImageUpload}
          uploading={uploading}
        />
        <Field className="md:col-span-2" label="Description" name="description" onChange={(e) => onChange(key, 'description', e.target.value)} required textarea value={form.description} />
      </>
    )
  }

  return (
    <>
      <Field label="Title" name="title" onChange={(e) => onChange(key, 'title', e.target.value)} required value={form.title} />
      <Field label="Order" name="order" onChange={(e) => onChange(key, 'order', e.target.value)} type="number" value={form.order} />
      <SelectField label="Audience" name="audience" onChange={(e) => onChange(key, 'audience', e.target.value)} value={form.audience}>
        <option value="public">Public</option>
        <option value="members">Members</option>
      </SelectField>
      <ImageUploadControl
        form={form}
        itemKey={key}
        onChange={onChange}
        onImageUpload={onImageUpload}
        uploading={uploading}
      />
      <Field className="md:col-span-2" label="Description" name="description" onChange={(e) => onChange(key, 'description', e.target.value)} required textarea value={form.description} />
    </>
  )
}

function FinanceRecordsTabs({
  activeTab,
  donations,
  expenses,
  onDeleteExpense,
  onDonationReceipt,
  onDonationReject,
  onDonationVerify,
  onEditExpense,
  onPaymentBulkReject,
  onPaymentBulkVerify,
  onPaymentReceipt,
  onPaymentReject,
  onPaymentVerify,
  payments,
  setActiveTab,
}) {
  const tabs = [
    ['payments', 'মাসিক ফি'],
    ['donations', 'দান'],
    ['expenses', 'ব্যয়'],
  ]

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={Table2} title="অর্থ রেকর্ড" />
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
          {tabs.map(([key, label]) => (
            <button
              className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition ${
                activeTab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600'
              }`}
              key={key}
              onClick={() => setActiveTab(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {activeTab === 'payments' ? (
          <VerificationList
            items={payments}
            onBulkReject={onPaymentBulkReject}
            onBulkVerify={onPaymentBulkVerify}
            onReceipt={onPaymentReceipt}
            onReject={onPaymentReject}
            onVerify={onPaymentVerify}
            title="মাসিক ফি"
          />
        ) : null}
        {activeTab === 'donations' ? (
          <VerificationList
            items={donations}
            onReceipt={onDonationReceipt}
            onReject={onDonationReject}
            onVerify={onDonationVerify}
            recordLabel="donation"
            requireRejectReason
            title="দান"
          />
        ) : null}
        {activeTab === 'expenses' ? (
          <ExpenseRecordsTable
            expenses={expenses}
            onDeleteExpense={onDeleteExpense}
            onEditExpense={onEditExpense}
          />
        ) : null}
      </div>
    </Panel>
  )
}

function ExpenseRecordsTable({ expenses, onDeleteExpense, onEditExpense }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const visibleExpenses = normalizedQuery
    ? expenses.filter((expense) =>
        [expense.title, expense.category, expense.note]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
      )
    : expenses

  return (
    <div>
      <Field
        label="ব্যয় খুঁজুন"
        name="expenseSearch"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="শিরোনাম, ক্যাটাগরি, নোট"
        value={query}
      />
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['শিরোনাম', 'ক্যাটাগরি', 'তারিখ', 'পরিমাণ', 'অ্যাকশন', 'রসিদ'].map((heading) => (
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  key={heading}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleExpenses.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                  No expenses found.
                </td>
              </tr>
            ) : null}
            {visibleExpenses.map((expense) => (
              <tr className="transition hover:bg-gray-50" key={expense._id}>
                <td className="px-4 py-3 font-semibold text-gray-900">{expense.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{expense.category}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{toReadableDate(expense.date)}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  {money(expense.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button icon={Pencil} onClick={() => onEditExpense(expense)} variant="secondary">
                      Edit
                    </Button>
                    <Button icon={Trash2} onClick={() => onDeleteExpense(expense._id)} variant="danger">
                      Delete
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {expense.receiptImageUrl ? (
                    <a
                      className="font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]"
                      href={expense.receiptImageUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <Button disabled variant="secondary">পূর্ববর্তী</Button>
          <Button disabled variant="secondary">পরবর্তী</Button>
        </div>
      </div>
    </div>
  )
}

function VerificationList({
  items,
  onBulkReject,
  onBulkVerify,
  onReceipt,
  onReject,
  onVerify,
  recordLabel = 'payment',
  requireRejectReason = false,
  title,
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [rejectModal, setRejectModal] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const normalizedQuery = query.trim().toLowerCase()
  const pageSize = 6
  const visibleItems = items.filter((item) => {
    const matchesStatus = statusFilter ? item.status === statusFilter : true
    const matchesQuery = normalizedQuery
      ? [
          item.user?.name,
          item.user?.phone,
          item.donorName,
          item.phone,
          item.method,
          item.status,
          item.transactionId,
          item.month,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))
      : true

    return matchesStatus && matchesQuery
  })
  const pageCount = Math.max(Math.ceil(visibleItems.length / pageSize), 1)
  const currentPage = Math.min(page, pageCount)
  const pagedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const supportsBulk = Boolean(onBulkReject && onBulkVerify)
  const usesRejectReason = supportsBulk || requireRejectReason
  const pagedPendingIds = pagedItems
    .filter((item) => item.status === 'pending')
    .map((item) => item._id)
  const selectedPendingIds = selectedIds.filter((id) =>
    visibleItems.some((item) => item._id === id && item.status === 'pending'),
  )
  const statusTabs = [
    ['', 'All'],
    ['pending', 'Pending'],
    ['verified', 'Approved'],
    ['rejected', 'Rejected'],
  ]

  const toggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const togglePageSelection = () => {
    setSelectedIds((current) =>
      pagedPendingIds.every((id) => current.includes(id))
        ? current.filter((id) => !pagedPendingIds.includes(id))
        : [...new Set([...current, ...pagedPendingIds])],
    )
  }

  const resetFilters = (nextStatus) => {
    setStatusFilter(nextStatus)
    setPage(1)
    setSelectedIds([])
  }

  const openRejectModal = (ids) => {
    setRejectModal({
      error: '',
      ids,
      reason: '',
    })
  }

  const submitReject = async (event) => {
    event.preventDefault()
    const reason = rejectModal?.reason?.trim()

    if (!reason) {
      setRejectModal((current) => ({ ...current, error: 'Reason is required.' }))
      return
    }

    if (rejectModal.ids.length === 1) {
      await onReject(rejectModal.ids[0], reason)
    } else {
      await onBulkReject(rejectModal.ids, reason)
    }

    setSelectedIds((current) => current.filter((id) => !rejectModal.ids.includes(id)))
    setRejectModal(null)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <Field
          className="min-w-64 flex-1"
          label={`${title} খুঁজুন`}
          name={`${title}-search`}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
            setSelectedIds([])
          }}
          placeholder="নাম, ফোন, ট্রানজেকশন, স্ট্যাটাস"
          value={query}
        />
        <SelectField
          className="min-w-48"
          label="স্ট্যাটাস"
          name={`${title}-status`}
          onChange={(event) => {
            resetFilters(event.target.value)
          }}
          value={statusFilter}
        >
          <option value="">সব</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </SelectField>
        <div className="flex min-h-11 items-end rounded-md border border-gray-200 bg-gray-50 p-1">
          {statusTabs.map(([key, label]) => (
            <button
              className={`h-9 rounded-md px-3 text-sm font-semibold transition ${
                statusFilter === key ? 'bg-[var(--brand-600)] text-white shadow-sm' : 'text-gray-600'
              }`}
              key={key || 'all'}
              onClick={() => resetFilters(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        {supportsBulk ? (
          <div className="flex flex-wrap items-end gap-2">
            <Button
              disabled={selectedPendingIds.length === 0}
              icon={CheckCircle2}
              onClick={async () => {
                if (
                  selectedPendingIds.length &&
                  window.confirm(`Approve ${selectedPendingIds.length} selected ${recordLabel}s?`)
                ) {
                  await onBulkVerify(selectedPendingIds)
                  setSelectedIds([])
                }
              }}
              variant="success"
            >
              Bulk approve
            </Button>
            <Button
              disabled={selectedPendingIds.length === 0}
              icon={XCircle}
              onClick={() => openRejectModal(selectedPendingIds)}
              variant="danger"
            >
              Bulk reject
            </Button>
          </div>
        ) : null}
      </div>

      <Modal
        onClose={() => setRejectModal(null)}
        open={Boolean(rejectModal)}
        title={`Reject ${recordLabel}`}
      >
        {rejectModal ? (
          <form className="grid gap-4" onSubmit={submitReject}>
            <p className="text-sm text-gray-600">
              Add a reason for rejecting {rejectModal.ids.length} selected {recordLabel}
              {rejectModal.ids.length > 1 ? 's' : ''}. The reason will stay with this record.
            </p>
            <Field
              error={rejectModal.error}
              label="Reason"
              name="paymentRejectionReason"
              onChange={(event) =>
                setRejectModal((current) => ({
                  ...current,
                  error: '',
                  reason: event.target.value,
                }))
              }
              required
              textarea
              value={rejectModal.reason}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setRejectModal(null)} variant="secondary">
                Cancel
              </Button>
              <Button icon={XCircle} type="submit" variant="danger">
                Reject
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {supportsBulk ? (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    aria-label="Select visible pending payments"
                    checked={
                      pagedPendingIds.length > 0 &&
                      pagedPendingIds.every((id) => selectedIds.includes(id))
                    }
                    className="h-4 w-4 accent-[var(--brand-600)]"
                    disabled={pagedPendingIds.length === 0}
                    onChange={togglePageSelection}
                    type="checkbox"
                  />
                </th>
              ) : null}
              {['নাম', 'পরিমাণ', 'মাধ্যম', 'ট্রানজেকশন', 'স্ট্যাটাস', 'অ্যাকশন'].map((heading) => (
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  key={heading}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedItems.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={supportsBulk ? 7 : 6}>
                  No {title.toLowerCase()} found.
                </td>
              </tr>
            ) : null}
            {pagedItems.map((item) => (
              <tr className="transition hover:bg-gray-50" key={item._id}>
                {supportsBulk ? (
                  <td className="px-4 py-3">
                    <input
                      aria-label={`Select ${item.user?.name || item.donorName || item.transactionId}`}
                      checked={selectedIds.includes(item._id)}
                      className="h-4 w-4 accent-[var(--brand-600)]"
                      disabled={item.status !== 'pending'}
                      onChange={() => toggleSelected(item._id)}
                      type="checkbox"
                    />
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={item.user?.name || item.donorName || item.transactionId}
                      size="sm"
                      src={item.user?.profilePhotoUrl}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.user?.name || item.donorName || item.transactionId}
                      </p>
                      <p className="text-xs text-gray-500">{item.user?.phone || item.phone}</p>
                      <p className="text-xs text-gray-500">Submitted {toReadableDate(item.createdAt)}</p>
                      {item.manualEntry ? (
                        <p className="text-xs font-semibold text-[var(--brand-600)]">
                          Manual entry by {item.createdBy?.name || 'admin'}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-bold text-gray-900">{money(item.amount)}</p>
                  {item.coveredMonths?.length ? (
                    <p className="mt-1 max-w-56 text-xs text-gray-500">
                      {formatCoveredMonths(item.coveredMonths)}
                    </p>
                  ) : item.month ? (
                    <p className="mt-1 text-xs text-gray-500">{item.month}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      {item.manualEntry ? 'Manual donation' : 'Donation'}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.method}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <p>{item.transactionId}</p>
                  {item.proofImageUrl ? (
                    <a
                      className="mt-1 inline-flex text-xs font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]"
                      href={item.proofImageUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View receipt
                    </a>
                  ) : null}
                  {item.rejectionReason ? (
                    <p className="mt-1 max-w-48 text-xs text-[var(--danger)]">
                      Reason: {item.rejectionReason}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Badge value={item.status}>{item.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {item.status === 'pending' ? (
                      <>
                        <Button icon={CheckCircle2} onClick={() => onVerify(item._id)}>
                          Verify
                        </Button>
                        <Button
                          icon={XCircle}
                          onClick={() =>
                            usesRejectReason ? openRejectModal([item._id]) : onReject(item._id)
                          }
                          variant="danger"
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button icon={FileText} onClick={() => onReceipt(item._id)} variant="secondary">
                        Receipt
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(value - 1, 1))}
              variant="secondary"
            >
              পূর্ববর্তী
            </Button>
            <Button
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(value + 1, pageCount))}
              variant="secondary"
            >
              পরবর্তী
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LogsTab({ auditLogs, notificationForm, onNotificationChange, onSendNotification }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const visibleLogs = normalizedQuery
    ? auditLogs.filter((log) =>
        [
          log.action,
          log.actor?.name,
          log.actor?.phone,
          log.entityType,
          ...Object.values(log.metadata || {}),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
      )
    : auditLogs

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={Bell} title="Send Notification" />
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSendNotification}>
          <Field
            label="Title"
            name="title"
            onChange={(event) => onNotificationChange('title', event.target.value)}
            required
            value={notificationForm.title}
          />
          <Field
            label="Type"
            name="type"
            onChange={(event) => onNotificationChange('type', event.target.value)}
            value={notificationForm.type}
          />
          <SelectField
            label="Channel"
            name="channel"
            onChange={(event) => onNotificationChange('channel', event.target.value)}
            value={notificationForm.channel}
          >
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="both">SMS + WhatsApp</option>
          </SelectField>
          <SelectField
            label="Send To"
            name="role"
            onChange={(event) => onNotificationChange('role', event.target.value)}
            value={notificationForm.role}
          >
            <option value="">All approved users</option>
            <option value="member">Members only</option>
            <option value="admin">Admins only</option>
          </SelectField>
          <Field
            label="Link"
            name="link"
            onChange={(event) => onNotificationChange('link', event.target.value)}
            placeholder="/member"
            value={notificationForm.link}
          />
          <Field
            className="md:col-span-2"
            label="Message"
            name="message"
            onChange={(event) => onNotificationChange('message', event.target.value)}
            required
            textarea
            value={notificationForm.message}
          />
          <Button className="md:col-span-2" icon={Bell} type="submit">
            Send Notification
          </Button>
        </form>
      </Panel>

      <Panel>
        <SectionTitle icon={ClipboardList} title="Audit Logs" />
        <Field
          className="mt-4"
          label="Search Logs"
          name="logSearch"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Action, actor, entity, amount"
          value={query}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Actor</th>
                <th className="py-3 pr-4">Entity</th>
                <th className="py-3 pr-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log) => (
                <tr className="border-b border-gray-100" key={log._id}>
                  <td className="py-3 pr-4 text-gray-600">{toReadableDate(log.createdAt)}</td>
                  <td className="py-3 pr-4 font-medium text-gray-950">{log.action}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {log.actor?.name || 'System'}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{log.entityType}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {Object.entries(log.metadata || {})
                      .slice(0, 3)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ') || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleLogs.length === 0 ? <Empty text="No matching audit logs found." /> : null}
        </div>
      </Panel>
    </div>
  )
}

function MiniList({ items, title }) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-950">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.length === 0 ? <Empty text="No members." /> : null}
        {items.map((item) => (
          <p className="text-sm text-gray-600" key={item._id}>
            {item.name} | {item.phone}
          </p>
        ))}
      </div>
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

function Empty({ text }) {
  return <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">{text}</p>
}
