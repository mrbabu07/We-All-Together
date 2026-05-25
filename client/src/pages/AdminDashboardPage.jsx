import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  Download,
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
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import SelectField from '../components/ui/SelectField'
import useAuth from '../hooks/useAuth'
import { downloadCsv } from '../utils/csvExport'

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '')
const toDateTimeInput = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '')
const toExportDate = (value) => (value ? new Date(value).toISOString() : '')

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

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const tabLabels = [
  ['overview', 'Overview'],
  ['finance', 'Finance'],
  ['content', 'Content'],
  ['members', 'Members'],
]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [data, setData] = useState({
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
      ])

      const settings = settingsResponse.data.data.settings
      setData({
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
    await runAction(async () => {
      await api.delete(`/expenses/${id}`)
    }, 'Expense deleted successfully.')
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
    await runAction(async () => {
      await api.delete(`${config.endpoint}/${id}`)
    }, `${config.title} item deleted successfully.`)
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

  const updateUserAccess = async (id, payload) => {
    await runAction(async () => {
      await api.patch(`/members/${id}/access`, payload)
    }, 'User access updated successfully.')
  }

  const deleteUser = async (id) => {
    await runAction(async () => {
      await api.delete(`/members/${id}`)
    }, 'User deleted successfully.')
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
          onApprove={(id) =>
            runAction(() => api.patch(`/registrations/${id}/approve`), 'Registration approved.')
          }
          onReject={(id) =>
            runAction(() => api.patch(`/registrations/${id}/reject`), 'Registration rejected.')
          }
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
          onPaymentVerify={(id) =>
            runAction(() => api.patch(`/payments/${id}/verify`), 'Payment verified.')
          }
          onDonationReject={(id) =>
            runAction(() => api.patch(`/donations/${id}/reject`), 'Donation rejected.')
          }
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
          uploadingContentKey={uploadingContentKey}
        />
      ) : null}

      {!loading && activeTab === 'members' ? (
        <MembersTab
          onDeleteUser={deleteUser}
          onUpdateAccess={updateUserAccess}
          onUpdateProfile={updateMemberProfile}
          users={data.users}
        />
      ) : null}
    </main>
  )
}

function OverviewTab({
  data,
  onApprove,
  onExportDonations,
  onExportExpenses,
  onExportPayments,
  onExportUsers,
  onReject,
  stats,
}) {
  return (
    <div className="mt-6 grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Stat label="Approved Members" value={stats.members} />
        <Stat label="Pending Users" value={stats.pending} />
        <Stat label="Income" value={money(stats.totalIncome)} />
        <Stat label="Expenses" value={money(stats.totalExpense)} />
        <Stat label="Balance" value={money(stats.balance)} />
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
              </div>
              <div className="flex flex-wrap gap-2">
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
  onPaymentVerify,
  onSaveExpense,
  onSettingsChange,
  onUpdateSettings,
  settingsForm,
}) {
  return (
    <div className="mt-6 grid gap-6">
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
        onLeftReject={onPaymentReject}
        onLeftVerify={onPaymentVerify}
        onRightReject={onDonationReject}
        onRightVerify={onDonationVerify}
        rightItems={data.donations}
        rightTitle="Donations"
      />
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
  uploadingContentKey,
}) {
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
        </Panel>
      ))}
    </div>
  )
}

function MembersTab({ onDeleteUser, onUpdateAccess, onUpdateProfile, users }) {
  const [editingUserId, setEditingUserId] = useState(null)
  const [memberForm, setMemberForm] = useState({
    address: '',
    name: '',
    phone: '',
    role: 'member',
    status: 'pending',
  })

  const startEdit = (user) => {
    setEditingUserId(user._id)
    setMemberForm({
      address: user.address || '',
      name: user.name || '',
      phone: user.phone || '',
      role: user.role || 'member',
      status: user.status || 'pending',
    })
  }

  const cancelEdit = () => {
    setEditingUserId(null)
    setMemberForm({
      address: '',
      name: '',
      phone: '',
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
      name: memberForm.name,
      phone: memberForm.phone,
    })
    await onUpdateAccess(editingUserId, {
      role: memberForm.role,
      status: memberForm.status,
    })
    cancelEdit()
  }

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
            <Button icon={Save} type="submit">
              Save User
            </Button>
            <Button onClick={cancelEdit} variant="secondary">
              Cancel
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <SectionTitle icon={ClipboardList} title="Users and Members" />
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
              {users.map((item) => (
                <tr className="border-b border-slate-100" key={item._id}>
                  <td className="py-3 pr-4 font-medium text-slate-950">{item.name}</td>
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
  onLeftReject,
  onLeftVerify,
  onRightReject,
  onRightVerify,
  rightItems,
  rightTitle,
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <VerificationList
        items={leftItems}
        onReject={onLeftReject}
        onVerify={onLeftVerify}
        title={leftTitle}
      />
      <VerificationList
        items={rightItems}
        onReject={onRightReject}
        onVerify={onRightVerify}
        title={rightTitle}
      />
    </div>
  )
}

function VerificationList({ items, onReject, onVerify, title }) {
  return (
    <Panel>
      <SectionTitle icon={CheckCircle2} title={title} />
      <div className="mt-4 grid gap-3">
        {items.length === 0 ? <Empty text={`No ${title.toLowerCase()}.`} /> : null}
        {items.map((item) => (
          <div className="rounded-md border border-slate-200 p-4" key={item._id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-950">
                  {item.user?.name || item.donorName || item.transactionId}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {money(item.amount)} | {item.method} | TX: {item.transactionId}
                </p>
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
