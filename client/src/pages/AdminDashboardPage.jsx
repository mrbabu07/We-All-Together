import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  DatabaseBackup,
  Download,
  FileText,
  KeyRound,
  Pencil,
  FilePlus2,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import SelectField from '../components/ui/SelectField'
import useAuth from '../hooks/useAuth'
import { downloadCsv } from '../utils/csvExport'
import { readFileAsDataUrl } from '../utils/fileUtils'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')
const toDateTimeInput = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '')
const toExportDate = (value) => (value ? new Date(value).toISOString() : '')
const toReadableDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A')

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

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
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [data, setData] = useState({
    auditLogs: [],
    analytics: {
      donationTrend: [],
      monthly: [],
      overdue: { amount: 0, count: 0, members: [] },
      summary: {},
    },
    content: { activities: [], meetings: [], notices: [], rules: [], tours: [] },
    donations: [],
    expenses: [],
    payments: [],
    pendingRegistrations: [],
    settings: {},
    users: [],
  })
  const [settingsForm, setSettingsForm] = useState({
    donationNumber: '',
    donationProvider: '',
    monthlyFee: 0,
    registrationFee: 0,
  })
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
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
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [notificationForm, setNotificationForm] = useState({
    link: '',
    message: '',
    role: '',
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
        payments: paymentsResponse.data.data.payments,
        pendingRegistrations: pendingResponse.data.data.users,
        settings,
        users: usersResponse.data.data.users,
      })
      setSettingsForm({
        donationNumber: settings.donationNumber || '',
        donationProvider: settings.donationProvider || '',
        monthlyFee: settings.monthlyFee || 0,
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
      ])
    }, 'Settings updated successfully.')
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
        title: '',
      })
    }, editingExpenseId ? 'Expense updated successfully.' : 'Expense added successfully.')
  }

  const editExpense = (expense) => {
    setEditingExpenseId(expense._id)
    setExpenseForm({
      amount: expense.amount || '',
      category: expense.category || '',
      date: toDateInput(expense.date),
      note: expense.note || '',
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
      title: '',
    })
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
        createdAt: toExportDate(item.createdAt),
        donorName: item.donorName,
        method: item.method,
        phone: item.phone,
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
      await api.post('/notifications/broadcast', notificationForm)
      setNotificationForm({
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
          <p className="text-sm font-semibold uppercase text-emerald-700">Admin</p>
          <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Signed in as {user?.name}</p>
        </div>
        <Button icon={RefreshCw} onClick={loadDashboard} variant="secondary">
          Refresh
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabLabels.map(([key, label]) => (
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
          <p className="text-sm text-slate-600">Loading dashboard...</p>
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
            requestConfirm({
              action: () =>
                runAction(
                  () => api.patch(`/registrations/${id}/reject`),
                  'Registration rejected.',
                ),
              confirmLabel: 'Reject',
              message: 'This registration will be rejected and cannot access member features.',
              title: 'Reject registration?',
              variant: 'danger',
            })
          }
          onRegistrationReceipt={(id) => printReceipt(`/receipts/registrations/${id}`)}
          stats={stats}
        />
      ) : null}

      {!loading && activeTab === 'finance' ? (
        <FinanceTab
          data={data}
          expenseForm={expenseForm}
          editingExpenseId={editingExpenseId}
          monthlyStatus={monthlyStatus}
          monthlyStatusMonth={monthlyStatusMonth}
          onCancelExpenseEdit={cancelExpenseEdit}
          onDeleteExpense={deleteExpense}
          onEditExpense={editExpense}
          onSaveExpense={saveExpense}
          onExpenseChange={(field, value) =>
            setExpenseForm((current) => ({ ...current, [field]: value }))
          }
          onLoadMonthlyStatus={loadMonthlyStatus}
          onMonthChange={setMonthlyStatusMonth}
          onPaymentReject={(id) =>
            runAction(() => api.patch(`/payments/${id}/reject`), 'Payment rejected.')
          }
          onPaymentReceipt={(id) => printReceipt(`/receipts/payments/${id}`)}
          onPaymentVerify={(id) =>
            runAction(() => api.patch(`/payments/${id}/verify`), 'Payment verified.')
          }
          onDonationReject={(id) =>
            runAction(() => api.patch(`/donations/${id}/reject`), 'Donation rejected.')
          }
          onDonationReceipt={(id) => printReceipt(`/receipts/donations/${id}`)}
          onDonationVerify={(id) =>
            runAction(() => api.patch(`/donations/${id}/verify`), 'Donation verified.')
          }
          onSettingsChange={(field, value) =>
            setSettingsForm((current) => ({ ...current, [field]: value }))
          }
          onUpdateSettings={updateSettings}
          settingsForm={settingsForm}
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
          onSaveMeetingAttendance={saveMeetingAttendance}
          onSaveTourParticipants={saveTourParticipants}
          uploadingContentKey={uploadingContentKey}
        />
      ) : null}

      {!loading && activeTab === 'members' ? (
        <MembersTab
          onDeleteUser={deleteUser}
          onResetPassword={resetUserPassword}
          onUpdateAccess={updateUserAccess}
          onUpdateProfile={updateMemberProfile}
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
  stats,
}) {
  return (
    <div className="mt-6 grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Members" value={stats.members} />
        <Stat label="Pending Approvals" value={stats.pending} />
        <Stat label="This Month Income" value={money(stats.thisMonthIncome)} />
        <Stat label="Overdue Fees" value={`${money(stats.overdueFees)} (${stats.overdueCount})`} />
      </div>

      <Panel>
        <SectionTitle icon={Download} title="Export Reports" />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button icon={Download} onClick={onExportUsers} variant="secondary">
            Users CSV
          </Button>
          <Button icon={Download} onClick={onExportPayments} variant="secondary">
            Payments CSV
          </Button>
          <Button icon={Download} onClick={onExportDonations} variant="secondary">
            Donations CSV
          </Button>
          <Button icon={Download} onClick={onExportExpenses} variant="secondary">
            Expenses CSV
          </Button>
          <Button icon={DatabaseBackup} onClick={onExportBackup} variant="secondary">
            Full Backup
          </Button>
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon={ClipboardList} title="Pending Registrations" />
        <div className="mt-4 grid gap-3">
          {data.pendingRegistrations.length === 0 ? <Empty text="No pending registrations." /> : null}
          {data.pendingRegistrations.map((item) => (
            <div
              className="grid gap-3 rounded-md border border-slate-200 p-4 lg:grid-cols-[1fr_auto]"
              key={item._id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">{item.name}</h3>
                  <Badge value={item.status}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.phone} | {item.address}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Registration payment: {money(item.registrationPayment?.amount)} via{' '}
                  {item.registrationPayment?.method || 'N/A'} | TX:{' '}
                  {item.registrationPayment?.transactionId || 'N/A'}
                </p>
                {item.registrationPayment?.proofImageUrl ? (
                  <a
                    className="mt-2 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    href={item.registrationPayment.proofImageUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View registration payment proof
                  </a>
                ) : null}
              </div>
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
                <Button icon={XCircle} onClick={() => onReject(item._id)} variant="danger">
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function FinanceTab({
  data,
  editingExpenseId,
  expenseForm,
  monthlyStatus,
  monthlyStatusMonth,
  onCancelExpenseEdit,
  onDeleteExpense,
  onEditExpense,
  onDonationReject,
  onDonationVerify,
  onExpenseChange,
  onLoadMonthlyStatus,
  onMonthChange,
  onPaymentReject,
  onPaymentReceipt,
  onPaymentVerify,
  onDonationReceipt,
  onSaveExpense,
  onSettingsChange,
  onUpdateSettings,
  settingsForm,
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

  return (
    <div className="mt-6 grid gap-6">
      <FinanceAnalytics analytics={data.analytics} />

      <FinanceSummary
        expenseCategories={expenseCategories}
        totalDonations={totalDonations}
        totalExpenses={totalExpenses}
        totalPayments={totalPayments}
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
          <Button className="md:col-span-2 xl:col-span-4" icon={Save} type="submit">
            Save Settings
          </Button>
        </form>
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
          <Field
            label="Category"
            name="category"
            onChange={(event) => onExpenseChange('category', event.target.value)}
            required
            value={expenseForm.category}
          />
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

      <Panel>
        <SectionTitle icon={ClipboardList} title="Expense List" />
        <div className="mt-4 grid gap-3">
          {data.expenses.length === 0 ? <Empty text="No expenses added yet." /> : null}
          {data.expenses.map((expense) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-4"
              key={expense._id}
            >
              <div>
                <h3 className="font-semibold text-slate-950">{expense.title}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {money(expense.amount)} | {expense.category}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button icon={Pencil} onClick={() => onEditExpense(expense)} variant="secondary">
                  Edit
                </Button>
                <Button icon={Trash2} onClick={() => onDeleteExpense(expense._id)} variant="danger">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <TwoColumnLists
        leftItems={data.payments}
        leftTitle="Member Payments"
        onLeftReceipt={onPaymentReceipt}
        onLeftReject={onPaymentReject}
        onLeftVerify={onPaymentVerify}
        onRightReceipt={onDonationReceipt}
        onRightReject={onDonationReject}
        onRightVerify={onDonationVerify}
        rightItems={data.donations}
        rightTitle="Donations"
      />
    </div>
  )
}

function FinanceAnalytics({ analytics }) {
  const monthly = analytics?.monthly || []
  const donationTrend = analytics?.donationTrend || []
  const overdueMembers = analytics?.overdue?.members || []

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel>
        <SectionTitle icon={ClipboardList} title="Income vs Expense" />
        <div className="mt-4 h-72">
          {monthly.length === 0 ? (
            <Empty text="No analytics data yet." />
          ) : (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
                <Bar dataKey="income" fill="#047857" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#be123c" name="Expense" radius={[4, 4, 0, 0]} />
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
            <ResponsiveContainer height="100%" width="100%">
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
                  stroke="#0891b2"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      <Panel className="xl:col-span-2">
        <SectionTitle icon={ClipboardList} title="Current Month Overdue Fees" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <SummaryStat label="Overdue Members" value={analytics?.overdue?.count || 0} />
          <SummaryStat label="Expected Collection" value={money(analytics?.overdue?.amount || 0)} />
          <SummaryStat label="This Month Income" value={money(analytics?.summary?.thisMonthIncome || 0)} />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {overdueMembers.length === 0 ? <Empty text="No overdue members this month." /> : null}
          {overdueMembers.map((member) => (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3" key={member._id}>
              <p className="font-semibold text-slate-950">{member.name}</p>
              <p className="mt-1 text-sm text-slate-600">{member.phone}</p>
              <p className="mt-1 text-sm text-slate-600">{member.address}</p>
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
        <h3 className="text-sm font-bold uppercase text-slate-500">Expense Categories</h3>
        {expenseCategories.length === 0 ? <Empty text="No category data yet." /> : null}
        {expenseCategories.map(([category, amount]) => (
          <div className="grid gap-2" key={category}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-700">{category}</span>
              <span className="font-bold text-slate-950">{money(amount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-700"
                style={{ width: `${Math.max((amount / maxCategoryAmount) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
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
  onSaveMeetingAttendance,
  onSaveTourParticipants,
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
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-4"
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
                    <h3 className="font-semibold text-slate-950">{item.title}</h3>
                    {item.audience ? <Badge value={item.audience}>{item.audience}</Badge> : null}
                    {item.status ? <Badge value={item.status}>{item.status}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item[config.main]}</p>
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
            <MeetingWorkflowPanel
              meetings={data.content.meetings}
              members={approvedMembers}
              onSave={onSaveMeetingAttendance}
            />
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
    <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-bold text-slate-950">Meeting Attendance</h3>
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
                  className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1fr_160px_1fr]"
                  key={member._id}
                >
                  <div>
                    <p className="font-semibold text-slate-950">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.phone}</p>
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
    <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-bold text-slate-950">Tour Participants</h3>
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
                  className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[1fr_150px_120px_120px_1fr]"
                  key={member._id}
                >
                  <div>
                    <p className="font-semibold text-slate-950">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.phone}</p>
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

function MembersTab({ onDeleteUser, onResetPassword, onUpdateAccess, onUpdateProfile, users }) {
  const [editingUserId, setEditingUserId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [query, setQuery] = useState('')
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
  const visibleUsers = normalizedQuery
    ? users.filter((item) =>
        [item.name, item.phone, item.address, item.role, item.status]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
      )
    : users

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
          <div className="mt-5 grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto]">
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
        <SectionTitle icon={ClipboardList} title="Users and Members" />
        <Field
          className="mt-4"
          label="Search Users"
          name="memberSearch"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, phone, address, role, status"
          value={query}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Phone</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Address</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((item) => (
                <tr className="border-b border-slate-100" key={item._id}>
                  <td className="py-3 pr-4 font-medium text-slate-950">
                    <div className="flex items-center gap-2">
                      {item.profilePhotoUrl ? (
                        <img
                          alt=""
                          className="h-9 w-9 rounded-md object-cover"
                          src={item.profilePhotoUrl}
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-xs font-bold text-emerald-800">
                          {item.name?.slice(0, 1) || 'U'}
                        </span>
                      )}
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{item.phone}</td>
                  <td className="py-3 pr-4 text-slate-600">{item.role}</td>
                  <td className="py-3 pr-4">
                    <Badge value={item.status}>{item.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{item.address}</td>
                  <td className="py-3 pr-4">
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
          {visibleUsers.length === 0 ? <Empty text="No matching users found." /> : null}
        </div>
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
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        <span>Upload Image</span>
        <input
          accept="image/*"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          disabled={uploading}
          onChange={(event) => onImageUpload(itemKey, event.target.files?.[0])}
          type="file"
        />
      </label>
      {uploading ? <p className="text-sm font-medium text-emerald-700">Uploading image...</p> : null}
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

function TwoColumnLists({
  leftItems,
  leftTitle,
  onLeftReceipt,
  onLeftReject,
  onLeftVerify,
  onRightReceipt,
  onRightReject,
  onRightVerify,
  rightItems,
  rightTitle,
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <VerificationList
        items={leftItems}
        onReceipt={onLeftReceipt}
        onReject={onLeftReject}
        onVerify={onLeftVerify}
        title={leftTitle}
      />
      <VerificationList
        items={rightItems}
        onReceipt={onRightReceipt}
        onReject={onRightReject}
        onVerify={onRightVerify}
        title={rightTitle}
      />
    </div>
  )
}

function VerificationList({ items, onReceipt, onReject, onVerify, title }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const visibleItems = normalizedQuery
    ? items.filter((item) =>
        [
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
          .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
      )
    : items

  return (
    <Panel>
      <SectionTitle icon={CheckCircle2} title={title} />
      <Field
        className="mt-4"
        label={`Search ${title}`}
        name={`${title}-search`}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Name, phone, transaction, status"
        value={query}
      />
      <div className="mt-4 grid gap-3">
        {visibleItems.length === 0 ? <Empty text={`No ${title.toLowerCase()} found.`} /> : null}
        {visibleItems.map((item) => (
          <div className="rounded-md border border-slate-200 p-4" key={item._id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-950">
                  {item.user?.name || item.donorName || item.transactionId}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {money(item.amount)} | {item.method} | TX: {item.transactionId}
                </p>
                {item.proofImageUrl ? (
                  <a
                    className="mt-2 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    href={item.proofImageUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View payment proof
                  </a>
                ) : null}
              </div>
              <Badge value={item.status}>{item.status}</Badge>
            </div>
            {item.status === 'pending' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button icon={CheckCircle2} onClick={() => onVerify(item._id)}>
                  Verify
                </Button>
                <Button icon={XCircle} onClick={() => onReject(item._id)} variant="danger">
                  Reject
                </Button>
              </div>
            ) : null}
            {item.status !== 'pending' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button icon={FileText} onClick={() => onReceipt(item._id)} variant="secondary">
                  Receipt
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
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
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Actor</th>
                <th className="py-3 pr-4">Entity</th>
                <th className="py-3 pr-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log) => (
                <tr className="border-b border-slate-100" key={log._id}>
                  <td className="py-3 pr-4 text-slate-600">{toReadableDate(log.createdAt)}</td>
                  <td className="py-3 pr-4 font-medium text-slate-950">{log.action}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {log.actor?.name || 'System'}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{log.entityType}</td>
                  <td className="py-3 pr-4 text-slate-600">
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
    <div className="rounded-md border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 grid gap-2">
        {items.length === 0 ? <Empty text="No members." /> : null}
        {items.map((item) => (
          <p className="text-sm text-slate-600" key={item._id}>
            {item.name} | {item.phone}
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
