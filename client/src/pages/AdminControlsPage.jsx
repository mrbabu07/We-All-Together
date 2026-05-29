import { useCallback, useEffect, useMemo, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  Archive,
  Bell,
  CheckCircle2,
  DatabaseBackup,
  Download,
  Eye,
  FileDown,
  FileInput,
  GalleryHorizontalEnd,
  Home,
  Image,
  Lock,
  Palette,
  RefreshCw,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserCog,
  WalletCards,
  XCircle,
} from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import useAppStore from '../store/appStore'
import { downloadCsv } from '../utils/csvExport'
import { readFileAsDataUrl } from '../utils/fileUtils'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import RichTextEditor from '../components/ui/RichTextEditor'
import SelectField from '../components/ui/SelectField'
import Skeleton from '../components/ui/Skeleton'

const defaultSettings = {
  appearance: {
    colorMode: 'light',
    customCss: '',
    fontSize: 'normal',
    heroImageUrl: '',
    primaryColor: ['#', '00ADB5'].join(''),
  },
  contentControls: {
    meetingTemplates: [],
    noticeCategories: [],
  },
  financeControls: {
    fiscalYearStartMonth: 1,
    lateFeeAmount: 0,
    lateFeeEnabled: false,
    monthlyFeeDueDate: 10,
  },
  homepageControls: {
    achievementsEnabled: true,
    certificateEnabled: true,
    certificateImageUrl: '',
    committeeEnabled: true,
    cookieConsentEnabled: true,
    countdownEnabled: true,
    darkModeToggleEnabled: true,
    facebookEmbedEnabled: false,
    facebookPageUrl: '',
    fontSizeControlsEnabled: true,
    galleryDownloadEnabled: true,
    googleMapsEmbedUrl: '',
    googleMapsEnabled: true,
    newsTickerEnabled: true,
    partnersEnabled: true,
    testimonialsEnabled: true,
    trustBadgeLabels: [],
    trustBadgesEnabled: true,
    typewriterPhrases: [],
    whatsappButtonEnabled: true,
    whatsappNumber: '',
    youtubeDescription: '',
    youtubeEnabled: false,
    youtubeTitle: '',
    youtubeUrl: '',
  },
  monthlyFee: 0,
  notificationSettings: {
    meetingReminder24hEnabled: false,
    paymentDecisionEnabled: true,
    registrationDecisionEnabled: true,
    smsFeeReminderEnabled: false,
    smsGloballyEnabled: false,
    smsMeetingEnabled: false,
    smsNoticeEnabled: false,
    tourRegistrationOpenEnabled: false,
    whatsappFeeReminderEnabled: false,
    whatsappMeetingEnabled: false,
    whatsappNoticeEnabled: false,
  },
  registrationFee: 0,
  securityControls: {
    adminIpWhitelist: [],
    autoBackupSchedule: 'off',
    twoFactorRequiredForAdmins: false,
  },
  siteSettings: {
    address: '',
    contactNumber: '',
    email: '',
    facebookUrl: '',
    logoUrl: '',
    maintenanceMode: false,
    orgName: 'Dargah Para OIkko Porishod',
    publicDonationsEnabled: true,
    registrationEnabled: true,
    tagline: '',
    welcomeMessage: '',
    whatsappGroupUrl: '',
    youtubeUrl: '',
  },
}

const defaultAnnouncementForm = {
  channel: 'in_app',
  link: '/member/notifications',
  message: '',
  recipientMode: 'all',
  scheduledFor: '',
  title: '',
  type: 'announcement',
  userIds: [],
}

const tabs = [
  { icon: ShieldCheck, key: 'site', label: 'সাইট সেটিংস' },
  { icon: Home, key: 'homepage', label: 'হোমপেজ নিয়ন্ত্রণ' },
  { icon: UserCog, key: 'members', label: 'সদস্য নিয়ন্ত্রণ' },
  { icon: WalletCards, key: 'finance', label: 'ফাইন্যান্স' },
  { icon: GalleryHorizontalEnd, key: 'content', label: 'কনটেন্ট' },
  { icon: Bell, key: 'notifications', label: 'নোটিফিকেশন' },
  { icon: Palette, key: 'appearance', label: 'অ্যাপ ডিজাইন' },
  { icon: Lock, key: 'security', label: 'সিকিউরিটি' },
]

const pathTabs = {
  '/admin/achievements': 'homepage',
  '/admin/committee': 'homepage',
  '/admin/notifications': 'notifications',
  '/admin/partners': 'homepage',
  '/admin/settings': 'site',
  '/admin/settings/appearance': 'appearance',
  '/admin/settings/org': 'site',
  '/admin/settings/security': 'security',
  '/admin/testimonials': 'homepage',
}

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`
const toDate = (value) => (value ? new Date(value).toLocaleString('en-BD') : 'N/A')

const parseCsv = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return { headers: [], rows: [] }
  }

  const headers = lines[0].split(',').map((item) => item.trim())
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((item) => item.trim())
    return headers.reduce((row, header, index) => ({ ...row, [header]: values[index] || '' }), {})
  })

  return { headers, rows }
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function AdminControlsPage() {
  const { setPreviewAppearance } = useAppStore()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(pathTabs[location.pathname] || 'site')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [controls, setControls] = useState({
    achievements: [],
    donations: [],
    gallery: [],
    blogs: [],
    committee: [],
    meetings: [],
    notices: [],
    notifications: [],
    partners: [],
    payments: [],
    recentActivity: [],
    rules: [],
    settings: defaultSettings,
    smsBalance: null,
    testimonials: [],
    tours: [],
    users: [],
  })
  const [settingsForm, setSettingsForm] = useState(defaultSettings)
  const [memberFilter, setMemberFilter] = useState({ query: '', role: '', status: '' })
  const [csvImport, setCsvImport] = useState({
    headers: [],
    mapping: { address: '', name: '', phone: '', role: '', status: '' },
    rows: [],
  })
  const [passwordReset, setPasswordReset] = useState({ newPassword: '', userId: '' })
  const [activityUser, setActivityUser] = useState(null)
  const [manualFeeForm, setManualFeeForm] = useState({
    amount: '',
    method: 'Manual',
    month: new Date().toISOString().slice(0, 7),
    transactionId: '',
    userId: '',
  })
  const [waiveForm, setWaiveForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    reason: '',
    userId: '',
  })
  const [archiveForm, setArchiveForm] = useState({ from: '', to: '' })
  const [announcementForm, setAnnouncementForm] = useState(defaultAnnouncementForm)

  const loadControls = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const [
        controlsResponse,
        donationsResponse,
        notificationsResponse,
        blogsResponse,
        noticesResponse,
        meetingsResponse,
        toursResponse,
        galleryResponse,
        rulesResponse,
        paymentsResponse,
        committeeResponse,
        achievementsResponse,
        testimonialsResponse,
        partnersResponse,
        smsBalanceResponse,
      ] = await Promise.all([
        api.get('/admin-controls'),
        api.get('/donations'),
        api.get('/notifications'),
        api.get('/blogs/members'),
        api.get('/notices/members'),
        api.get('/meetings/members'),
        api.get('/tours/members'),
        api.get('/gallery/members'),
        api.get('/rules/members'),
        api.get('/payments'),
        api.get('/committee/admin'),
        api.get('/achievements/admin'),
        api.get('/testimonials/admin'),
        api.get('/partners/admin'),
        api.get('/notifications/sms-balance'),
      ])
      const settings = {
        ...defaultSettings,
        ...controlsResponse.data.data.settings,
        appearance: {
          ...defaultSettings.appearance,
          ...controlsResponse.data.data.settings?.appearance,
        },
        contentControls: {
          ...defaultSettings.contentControls,
          ...controlsResponse.data.data.settings?.contentControls,
        },
        financeControls: {
          ...defaultSettings.financeControls,
          ...controlsResponse.data.data.settings?.financeControls,
        },
        homepageControls: {
          ...defaultSettings.homepageControls,
          ...controlsResponse.data.data.settings?.homepageControls,
        },
        notificationSettings: {
          ...defaultSettings.notificationSettings,
          ...controlsResponse.data.data.settings?.notificationSettings,
        },
        securityControls: {
          ...defaultSettings.securityControls,
          ...controlsResponse.data.data.settings?.securityControls,
        },
        siteSettings: {
          ...defaultSettings.siteSettings,
          ...controlsResponse.data.data.settings?.siteSettings,
        },
      }

      setControls({
        achievements: achievementsResponse.data.data.items,
        blogs: blogsResponse.data.data.blogs,
        committee: committeeResponse.data.data.items,
        donations: donationsResponse.data.data.donations,
        gallery: galleryResponse.data.data.items,
        meetings: meetingsResponse.data.data.items,
        notices: noticesResponse.data.data.items,
        notifications: notificationsResponse.data.data.notifications,
        partners: partnersResponse.data.data.items,
        payments: paymentsResponse.data.data.payments,
        recentActivity: controlsResponse.data.data.recentActivity,
        rules: rulesResponse.data.data.items,
        settings,
        smsBalance: smsBalanceResponse.data.data.balance,
        testimonials: testimonialsResponse.data.data.items,
        tours: toursResponse.data.data.items,
        users: controlsResponse.data.data.users,
      })
      setSettingsForm(settings)
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(loadControls, 0)
    return () => window.clearTimeout(timer)
  }, [loadControls])

  const approvedMembers = useMemo(
    () =>
      controls.users.filter(
        (user) => user.status === 'approved' && ['member', 'moderator', 'admin'].includes(user.role),
      ),
    [controls.users],
  )

  const filteredMembers = useMemo(() => {
    const query = memberFilter.query.trim().toLowerCase()

    return controls.users.filter((user) => {
      const matchesQuery = query
        ? [user.name, user.phone, user.address].filter(Boolean).some((value) =>
            String(value).toLowerCase().includes(query),
          )
        : true
      const matchesStatus = memberFilter.status ? user.status === memberFilter.status : true
      const matchesRole = memberFilter.role ? user.role === memberFilter.role : true

      return matchesQuery && matchesStatus && matchesRole
    })
  }, [controls.users, memberFilter])

  const updateSettingsField = (section, field, value) => {
    if (field === undefined) {
      setSettingsForm((current) => ({
        ...current,
        [section]: value,
      }))
      return
    }

    setSettingsForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await api.patch('/admin-controls', settingsForm)
      const nextSettings = {
        ...settingsForm,
        ...response.data.data.settings,
      }
      setSettingsForm(nextSettings)
      setControls((current) => ({ ...current, settings: nextSettings }))
      setPreviewAppearance(nextSettings.appearance || null)
      toast.success('সেটিংস সংরক্ষণ হয়েছে')
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const uploadImageFile = async (file, name = `homepage-${Date.now()}`) => {
    if (!file) {
      return ''
    }

    const image = await readFileAsDataUrl(file)
    const response = await api.post('/uploads/image', { image, name })
    toast.success('ছবি আপলোড হয়েছে')
    return response.data.data.image.url
  }

  const uploadSettingImage = async (section, field, file) => {
    try {
      const url = await uploadImageFile(file, `${field}-${Date.now()}`)
      if (url) updateSettingsField(section, field, url)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const runAction = async (action, successMessage) => {
    try {
      setMessage('')
      await action()
      toast.success(successMessage)
      await loadControls()
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setMessage(errorMessage)
      toast.error(errorMessage)
    }
  }

  const requestConfirm = (config) => setConfirmDialog(config)
  const closeConfirm = () => setConfirmDialog(null)
  const confirmSelected = async () => {
    const action = confirmDialog?.action
    setConfirmDialog(null)
    if (action) {
      await action()
    }
  }

  const exportMembersCsv = () => {
    const ok = downloadCsv(
      'members.csv',
      filteredMembers.map((user) => ({
        address: user.address || '',
        joined: user.createdAt || '',
        lastLogin: user.lastLoginAt || '',
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
      })),
    )
    toast[ok ? 'success' : 'error'](ok ? 'CSV ডাউনলোড হয়েছে' : 'রপ্তানির জন্য ডাটা নেই')
  }

  const exportMembersPdf = async () => {
    const response = await api.get('/admin-controls/members-report.pdf', {
      params: {
        role: memberFilter.role || undefined,
        status: memberFilter.status || undefined,
      },
      responseType: 'blob',
    })
    downloadBlob(response.data, 'member-report.pdf')
  }

  const exportFinancePdf = async () => {
    const response = await api.get('/admin-controls/finance-report.pdf', {
      responseType: 'blob',
    })
    downloadBlob(response.data, 'finance-report.pdf')
  }

  const handleCsvFile = (file) => {
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result || ''))
      setCsvImport({
        headers: parsed.headers,
        mapping: {
          address: parsed.headers.find((item) => /address/i.test(item)) || '',
          name: parsed.headers.find((item) => /name/i.test(item)) || '',
          phone: parsed.headers.find((item) => /phone|mobile/i.test(item)) || '',
          role: parsed.headers.find((item) => /role/i.test(item)) || '',
          status: parsed.headers.find((item) => /status/i.test(item)) || '',
        },
        rows: parsed.rows,
      })
    }
    reader.readAsText(file)
  }

  const importMembers = async () => {
    const members = csvImport.rows.map((row) => ({
      address: row[csvImport.mapping.address] || '',
      name: row[csvImport.mapping.name] || '',
      phone: row[csvImport.mapping.phone] || '',
      role: row[csvImport.mapping.role] || 'member',
      status: row[csvImport.mapping.status] || 'approved',
    }))

    await runAction(async () => {
      await api.post('/admin-controls/members/import', { members })
      setCsvImport({
        headers: [],
        mapping: { address: '', name: '', phone: '', role: '', status: '' },
        rows: [],
      })
    }, 'CSV ইমপোর্ট সম্পন্ন হয়েছে')
  }

  const previewAppearance = () => {
    setPreviewAppearance(settingsForm.appearance)
    window.open('/', '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Panel>
          <Skeleton rows={8} />
        </Panel>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">Control Panel</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            অ্যাডমিন কন্ট্রোল প্যানেল
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            সাইট, সদস্য, অর্থ, কনটেন্ট, নোটিফিকেশন ও নিরাপত্তা এক জায়গা থেকে নিয়ন্ত্রণ করুন।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={RefreshCw} onClick={loadControls} variant="secondary">
            রিফ্রেশ
          </Button>
          <Button icon={Save} loading={saving} onClick={saveSettings}>
            সব সেটিংস সেভ
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key

          return (
            <button
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'site' ? (
        <SiteSettingsTab
          form={settingsForm}
          onChange={updateSettingsField}
          onSave={saveSettings}
          onUpload={uploadSettingImage}
          saving={saving}
        />
      ) : null}
      {activeTab === 'homepage' ? (
        <HomepageControlsTab
          collections={{
            achievements: controls.achievements,
            committee: controls.committee,
            partners: controls.partners,
            testimonials: controls.testimonials,
          }}
          form={settingsForm}
          onChange={updateSettingsField}
          onCreate={(collection, payload) =>
            runAction(() => api.post(`/${collection}`, payload), 'Homepage item saved')
          }
          onDelete={(collection, item) =>
            requestConfirm({
              action: () =>
                runAction(() => api.delete(`/${collection}/${item._id}`), 'Homepage item deleted'),
              message: `${item.name || item.title} মুছে ফেলতে চান?`,
              title: 'Delete item?',
              variant: 'danger',
            })
          }
          onReorder={(collection, orderedIds) =>
            runAction(
              () => api.patch(`/${collection}/reorder`, { orderedIds }),
              'Homepage order updated',
            )
          }
          onSave={saveSettings}
          onUpdate={(collection, item, payload) =>
            runAction(() => api.patch(`/${collection}/${item._id}`, payload), 'Homepage item updated')
          }
          onUploadImage={uploadImageFile}
          onUploadSetting={uploadSettingImage}
          saving={saving}
        />
      ) : null}
      {activeTab === 'members' ? (
        <MemberControlsTab
          activityUser={activityUser}
          csvImport={csvImport}
          filter={memberFilter}
          filteredMembers={filteredMembers}
          members={approvedMembers}
          onActivity={async (user) => {
            const response = await api.get(`/members/${user._id}/activity`)
            setActivityUser({ ...user, activity: response.data.data })
          }}
          onBulkApprove={(userIds) =>
            requestConfirm({
              action: () =>
                runAction(
                  () => api.post('/admin-controls/members/bulk-approve', { userIds }),
                  'সব pending সদস্য approve হয়েছে',
                ),
              message: 'সব pending আবেদন approve করতে চান?',
              title: 'Bulk approve',
            })
          }
          onBulkReject={(reason, userIds) =>
            requestConfirm({
              action: () =>
                runAction(
                  () => api.post('/admin-controls/members/bulk-reject', { reason, userIds }),
                  'সব pending সদস্য reject হয়েছে',
                ),
              message: 'সব pending আবেদন reject করতে চান?',
              title: 'Bulk reject',
              variant: 'danger',
            })
          }
          onDelete={(user) =>
            requestConfirm({
              action: () =>
                runAction(() => api.delete(`/members/${user._id}`), 'সদস্য soft delete হয়েছে'),
              message: `${user.name} কে soft delete করা হবে। ডাটা ৩০ দিনের জন্য রাখা থাকবে।`,
              title: 'সদস্য delete?',
              variant: 'danger',
            })
          }
          onExportCsv={exportMembersCsv}
          onExportPdf={() => runAction(exportMembersPdf, 'PDF ডাউনলোড হয়েছে')}
          onFile={handleCsvFile}
          onFilter={setMemberFilter}
          onImport={importMembers}
          onMapping={(mapping) => setCsvImport((current) => ({ ...current, mapping }))}
          onPasswordReset={(event) => {
            event.preventDefault()
            runAction(
              () =>
                api.patch(`/members/${passwordReset.userId}/password`, {
                  newPassword: passwordReset.newPassword,
                }),
              'পাসওয়ার্ড reset হয়েছে',
            )
          }}
          onRole={(user, role) =>
            runAction(() => api.patch(`/members/${user._id}/access`, { role }), 'Role updated')
          }
          onStatus={(user, status) =>
            runAction(() => api.patch(`/members/${user._id}/access`, { status }), 'Status updated')
          }
          onSuspend={(user) =>
            runAction(
              () =>
                api.patch(`/admin-controls/members/${user._id}/suspension`, {
                  reason: user.suspendedAt ? '' : 'Suspended by admin control panel',
                  suspended: !user.suspendedAt,
                }),
              user.suspendedAt ? 'Suspension removed' : 'Member suspended',
            )
          }
          passwordReset={passwordReset}
          setPasswordReset={setPasswordReset}
        />
      ) : null}
      {activeTab === 'finance' ? (
        <FinanceControlsTab
          donations={controls.donations}
          form={settingsForm}
          manualFeeForm={manualFeeForm}
          members={approvedMembers}
          onChange={updateSettingsField}
          onDonationStatus={(donation, action) =>
            runAction(() => api.patch(`/donations/${donation._id}/${action}`), 'Donation updated')
          }
          onExportFinance={() => runAction(exportFinancePdf, 'Finance PDF downloaded')}
          onManualFee={(event) => {
            event.preventDefault()
            runAction(
              () => api.post('/admin-controls/finance/manual-fee', manualFeeForm),
              'Manual fee saved',
            )
          }}
          onSave={saveSettings}
          onWaive={(event) => {
            event.preventDefault()
            runAction(() => api.post('/admin-controls/finance/waive-fee', waiveForm), 'Fee waived')
          }}
          saving={saving}
          setManualFeeForm={setManualFeeForm}
          setWaiveForm={setWaiveForm}
          waiveForm={waiveForm}
        />
      ) : null}
      {activeTab === 'content' ? (
        <ContentControlsTab
          archiveForm={archiveForm}
          blogs={controls.blogs}
          form={settingsForm}
          gallery={controls.gallery}
          meetings={controls.meetings}
          notices={controls.notices}
          onArchive={(event) => {
            event.preventDefault()
            runAction(() => api.post('/notices/archive-bulk', archiveForm), 'Notices archived')
          }}
          onArchiveChange={setArchiveForm}
          onBlogModerate={(blog, status) =>
            runAction(
              () => api.patch(`/blogs/${blog._id}/moderation`, { status }),
              'Blog moderation updated',
            )
          }
          onCategoryAdd={(category) => {
            if (!category.trim()) return
            updateSettingsField('contentControls', 'noticeCategories', [
              ...(settingsForm.contentControls.noticeCategories || []),
              category.trim(),
            ])
          }}
          onCategoryRemove={(category) =>
            updateSettingsField(
              'contentControls',
              'noticeCategories',
              settingsForm.contentControls.noticeCategories.filter((item) => item !== category),
            )
          }
          onGalleryMove={(item, album) =>
            runAction(
              () =>
                api.patch(`/gallery/${item._id}`, {
                  ...item,
                  album,
                }),
              'Gallery album updated',
            )
          }
          onNoticePin={(notice) =>
            runAction(
              () =>
                api.patch(`/notices/${notice._id}`, {
                  ...notice,
                  pinned: !notice.pinned,
                }),
              'Notice updated',
            )
          }
          onSave={saveSettings}
          onTemplateAdd={(template) =>
            updateSettingsField('contentControls', 'meetingTemplates', [
              ...(settingsForm.contentControls.meetingTemplates || []),
              template,
            ])
          }
          rules={controls.rules}
          saving={saving}
        />
      ) : null}
      {activeTab === 'notifications' ? (
        <NotificationControlsTab
          announcementForm={announcementForm}
          form={settingsForm}
          notifications={controls.notifications}
          onAnnouncement={(event) => {
            event.preventDefault()
            runAction(
              async () => {
                await api.post('/notifications/send', announcementForm)
                setAnnouncementForm(defaultAnnouncementForm)
              },
              'Announcement processed',
            )
          }}
          onAnnouncementChange={(field, value) =>
            setAnnouncementForm((current) => ({ ...current, [field]: value }))
          }
          onChange={updateSettingsField}
          onSave={saveSettings}
          saving={saving}
          smsBalance={controls.smsBalance}
          users={approvedMembers}
        />
      ) : null}
      {activeTab === 'appearance' ? (
        <AppearanceTab
          form={settingsForm}
          onChange={updateSettingsField}
          onPreview={previewAppearance}
          onSave={saveSettings}
          onUpload={uploadSettingImage}
          saving={saving}
        />
      ) : null}
      {activeTab === 'security' ? (
        <SecurityTab
          form={settingsForm}
          onAuditExport={() =>
            runAction(async () => {
              const response = await api.get('/audit-logs', {
                params: { format: 'csv', limit: 200 },
                responseType: 'blob',
              })
              downloadBlob(response.data, 'audit-logs.csv')
            }, 'Audit CSV downloaded')
          }
          onBackup={() =>
            runAction(async () => {
              const response = await api.get('/backup')
              const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                type: 'application/json',
              })
              downloadBlob(blob, 'dargah-backup.json')
            }, 'Backup downloaded')
          }
          onChange={updateSettingsField}
          onForceLogout={(targetUser) =>
            requestConfirm({
              action: () =>
                runAction(
                  () => api.post(`/admin-controls/sessions/${targetUser._id}/revoke`),
                  'User sessions revoked',
                ),
              message: `${targetUser.name} will need to log in again on every device.`,
              title: 'Force logout?',
              variant: 'danger',
            })
          }
          onPasswordChange={async (payload) => {
            try {
              await api.patch('/auth/change-password', payload)
              toast.success('Password changed. Please log in again on other devices.')
            } catch (error) {
              const errorMessage = getErrorMessage(error)
              setMessage(errorMessage)
              toast.error(errorMessage)
            }
          }}
          onSave={saveSettings}
          presence={controls.presence}
          recentActivity={controls.recentActivity}
          saving={saving}
          users={controls.users}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel={confirmDialog?.confirmLabel || 'Confirm'}
        message={confirmDialog?.message}
        onCancel={closeConfirm}
        onConfirm={confirmSelected}
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        variant={confirmDialog?.variant}
      />
    </main>
  )
}

function Toggle({ checked, label, onChange }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input
        checked={checked}
        className="h-5 w-5 accent-indigo-600"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}

function FileUploadButton({ label, onUpload }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
      <Upload aria-hidden="true" className="h-4 w-4" />
      {label}
      <input
        accept="image/*"
        className="sr-only"
        onChange={(event) => onUpload(event.target.files?.[0])}
        type="file"
      />
    </label>
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

function SiteSettingsTab({ form, onChange, onSave, onUpload, saving }) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
      <Panel>
        <SectionTitle icon={ShieldCheck} title="সাইট সেটিংস" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="সংগঠনের নাম"
            name="orgName"
            onChange={(event) => onChange('siteSettings', 'orgName', event.target.value)}
            value={form.siteSettings.orgName}
          />
          <Field
            label="ট্যাগলাইন"
            name="tagline"
            onChange={(event) => onChange('siteSettings', 'tagline', event.target.value)}
            value={form.siteSettings.tagline}
          />
          <Field
            label="যোগাযোগ নম্বর"
            name="contactNumber"
            onChange={(event) => onChange('siteSettings', 'contactNumber', event.target.value)}
            value={form.siteSettings.contactNumber}
          />
          <Field
            label="ইমেইল"
            name="email"
            onChange={(event) => onChange('siteSettings', 'email', event.target.value)}
            value={form.siteSettings.email}
          />
          <Field
            label="ঠিকানা"
            name="address"
            onChange={(event) => onChange('siteSettings', 'address', event.target.value)}
            value={form.siteSettings.address}
          />
          <Field
            label="রেজিস্ট্রেশন ফি"
            name="registrationFee"
            onChange={(event) =>
              onChange('registrationFee', undefined, Number(event.target.value || 0))
            }
            type="number"
            value={form.registrationFee}
          />
          <Field
            label="মাসিক ফি"
            name="monthlyFee"
            onChange={(event) => onChange('monthlyFee', undefined, Number(event.target.value || 0))}
            type="number"
            value={form.monthlyFee}
          />
          <Field
            label="Facebook link"
            name="facebookUrl"
            onChange={(event) => onChange('siteSettings', 'facebookUrl', event.target.value)}
            value={form.siteSettings.facebookUrl}
          />
          <Field
            label="YouTube link"
            name="youtubeUrl"
            onChange={(event) => onChange('siteSettings', 'youtubeUrl', event.target.value)}
            value={form.siteSettings.youtubeUrl}
          />
          <Field
            label="WhatsApp group"
            name="whatsappGroupUrl"
            onChange={(event) => onChange('siteSettings', 'whatsappGroupUrl', event.target.value)}
            value={form.siteSettings.whatsappGroupUrl}
          />
          <Field
            label="লোগো URL"
            name="logoUrl"
            onChange={(event) => onChange('siteSettings', 'logoUrl', event.target.value)}
            value={form.siteSettings.logoUrl}
          />
          <div className="flex items-end">
            <FileUploadButton
              label="লোগো আপলোড"
              onUpload={(file) => onUpload('siteSettings', 'logoUrl', file)}
            />
          </div>
          <div className="md:col-span-2">
            <RichTextEditor
              label="সদস্য ড্যাশবোর্ড welcome message"
              onChange={(value) => onChange('siteSettings', 'welcomeMessage', value)}
              value={form.siteSettings.welcomeMessage || ''}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button icon={Save} loading={saving} onClick={onSave}>
            সাইট সেটিংস সেভ
          </Button>
        </div>
      </Panel>
      <Panel>
        <SectionTitle icon={ShieldCheck} title="সাইট টগল" />
        <div className="mt-5 grid gap-3">
          <Toggle
            checked={form.siteSettings.registrationEnabled}
            label="নতুন নিবন্ধন চালু"
            onChange={(value) => onChange('siteSettings', 'registrationEnabled', value)}
          />
          <Toggle
            checked={form.siteSettings.publicDonationsEnabled}
            label="পাবলিক দান চালু"
            onChange={(value) => onChange('siteSettings', 'publicDonationsEnabled', value)}
          />
          <Toggle
            checked={form.siteSettings.maintenanceMode}
            label="Maintenance mode"
            onChange={(value) => onChange('siteSettings', 'maintenanceMode', value)}
          />
        </div>
      </Panel>
    </div>
  )
}

const homepageManagerConfigs = [
  {
    fields: [
      { label: 'নাম', name: 'name', required: true },
      { label: 'পদবি', name: 'position', required: true },
      { label: 'ফোন', name: 'phone' },
      { label: 'ছবির URL', name: 'photo', type: 'image' },
      { label: 'ক্রম', name: 'order', type: 'number' },
    ],
    icon: UserCog,
    key: 'committee',
    photoField: 'photo',
    title: 'কমিটি সদস্য',
    toggles: [
      { label: 'ফোন দেখান', name: 'showPhone' },
      { label: 'Active', name: 'active' },
    ],
  },
  {
    fields: [
      { label: 'বছর', name: 'year', required: true },
      { label: 'শিরোনাম', name: 'title', required: true },
      { label: 'বিবরণ', name: 'description', required: true, textarea: true },
      { label: 'ছবির URL', name: 'photo', type: 'image' },
      { label: 'ক্রম', name: 'order', type: 'number' },
    ],
    icon: Star,
    key: 'achievements',
    photoField: 'photo',
    title: 'অর্জন',
    toggles: [{ label: 'Active', name: 'active' }],
  },
  {
    fields: [
      { label: 'সদস্যের নাম', name: 'name', required: true },
      { label: 'প্রশংসাপত্র', name: 'text', required: true, textarea: true },
      { label: 'যোগদানের বছর', name: 'joinYear' },
      { label: 'ছবির URL', name: 'photo', type: 'image' },
      { label: 'ক্রম', name: 'order', type: 'number' },
    ],
    icon: Bell,
    key: 'testimonials',
    photoField: 'photo',
    title: 'প্রশংসাপত্র',
    toggles: [{ label: 'Active', name: 'active' }],
  },
  {
    fields: [
      { label: 'প্রতিষ্ঠানের নাম', name: 'name', required: true },
      { label: 'লোগো URL', name: 'logo', required: true, type: 'image' },
      { label: 'ওয়েবসাইট URL', name: 'websiteUrl' },
      { label: 'ক্রম', name: 'order', type: 'number' },
    ],
    icon: Image,
    key: 'partners',
    photoField: 'logo',
    title: 'সহযোগী প্রতিষ্ঠান',
    toggles: [{ label: 'Active', name: 'active' }],
  },
]

const createEmptyHomepageDrafts = () =>
  homepageManagerConfigs.reduce(
    (drafts, config) => ({
      ...drafts,
      [config.key]: { active: true, order: 0, showPhone: false },
    }),
    {},
  )

const toLines = (value) => (Array.isArray(value) ? value.join('\n') : '')
const fromLines = (value) =>
  String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)

function HomepageControlsTab({
  collections,
  form,
  onChange,
  onCreate,
  onDelete,
  onReorder,
  onSave,
  onUpdate,
  onUploadImage,
  onUploadSetting,
  saving,
}) {
  const [drafts, setDrafts] = useState(createEmptyHomepageDrafts)
  const homepage = form.homepageControls || defaultSettings.homepageControls

  const updateDraft = (key, field, value) => {
    setDrafts((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: value,
      },
    }))
  }

  const resetDraft = (key) => {
    setDrafts((current) => ({
      ...current,
      [key]: { active: true, order: 0, showPhone: false },
    }))
  }

  const submitDraft = async (event, config) => {
    event.preventDefault()
    const draft = drafts[config.key] || {}
    const payload = { ...draft, order: Number(draft.order || 0) }
    const existing = draft._id ? draft : null

    if (existing) {
      await onUpdate(config.key, existing, payload)
    } else {
      await onCreate(config.key, payload)
    }
    resetDraft(config.key)
  }

  const moveItem = (config, item, direction) => {
    const items = collections[config.key] || []
    const currentIndex = items.findIndex((entry) => entry._id === item._id)
    const nextIndex = currentIndex + direction

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
      return
    }

    const orderedItems = [...items]
    const [selectedItem] = orderedItems.splice(currentIndex, 1)
    orderedItems.splice(nextIndex, 0, selectedItem)
    onReorder(config.key, orderedItems.map((entry) => entry._id))
  }

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={Home} title="হোমপেজ নিয়ন্ত্রণ" />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Toggle checked={homepage.newsTickerEnabled} label="News ticker" onChange={(value) => onChange('homepageControls', 'newsTickerEnabled', value)} />
          <Toggle checked={homepage.countdownEnabled} label="Countdown timer" onChange={(value) => onChange('homepageControls', 'countdownEnabled', value)} />
          <Toggle checked={homepage.committeeEnabled} label="Committee section" onChange={(value) => onChange('homepageControls', 'committeeEnabled', value)} />
          <Toggle checked={homepage.achievementsEnabled} label="Achievements timeline" onChange={(value) => onChange('homepageControls', 'achievementsEnabled', value)} />
          <Toggle checked={homepage.testimonialsEnabled} label="Testimonials" onChange={(value) => onChange('homepageControls', 'testimonialsEnabled', value)} />
          <Toggle checked={homepage.partnersEnabled} label="Partner logos" onChange={(value) => onChange('homepageControls', 'partnersEnabled', value)} />
          <Toggle checked={homepage.whatsappButtonEnabled} label="WhatsApp button" onChange={(value) => onChange('homepageControls', 'whatsappButtonEnabled', value)} />
          <Toggle checked={homepage.googleMapsEnabled} label="Google Maps" onChange={(value) => onChange('homepageControls', 'googleMapsEnabled', value)} />
          <Toggle checked={homepage.youtubeEnabled} label="YouTube video" onChange={(value) => onChange('homepageControls', 'youtubeEnabled', value)} />
          <Toggle checked={homepage.facebookEmbedEnabled} label="Facebook embed" onChange={(value) => onChange('homepageControls', 'facebookEmbedEnabled', value)} />
          <Toggle checked={homepage.trustBadgesEnabled} label="Trust badges" onChange={(value) => onChange('homepageControls', 'trustBadgesEnabled', value)} />
          <Toggle checked={homepage.certificateEnabled} label="Certificate section" onChange={(value) => onChange('homepageControls', 'certificateEnabled', value)} />
          <Toggle checked={homepage.cookieConsentEnabled} label="Cookie consent" onChange={(value) => onChange('homepageControls', 'cookieConsentEnabled', value)} />
          <Toggle checked={homepage.darkModeToggleEnabled} label="Dark mode toggle" onChange={(value) => onChange('homepageControls', 'darkModeToggleEnabled', value)} />
          <Toggle checked={homepage.fontSizeControlsEnabled} label="Font size controls" onChange={(value) => onChange('homepageControls', 'fontSizeControlsEnabled', value)} />
          <Toggle checked={homepage.galleryDownloadEnabled} label="Gallery download" onChange={(value) => onChange('homepageControls', 'galleryDownloadEnabled', value)} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="WhatsApp number" name="whatsappNumber" onChange={(event) => onChange('homepageControls', 'whatsappNumber', event.target.value)} value={homepage.whatsappNumber || ''} />
          <Field label="Google Maps embed URL/code" name="googleMapsEmbedUrl" onChange={(event) => onChange('homepageControls', 'googleMapsEmbedUrl', event.target.value)} value={homepage.googleMapsEmbedUrl || ''} />
          <Field label="YouTube URL/embed code" name="youtubeUrl" onChange={(event) => onChange('homepageControls', 'youtubeUrl', event.target.value)} value={homepage.youtubeUrl || ''} />
          <Field label="YouTube title" name="youtubeTitle" onChange={(event) => onChange('homepageControls', 'youtubeTitle', event.target.value)} value={homepage.youtubeTitle || ''} />
          <Field label="YouTube description" name="youtubeDescription" onChange={(event) => onChange('homepageControls', 'youtubeDescription', event.target.value)} textarea value={homepage.youtubeDescription || ''} />
          <Field label="Facebook page URL" name="facebookPageUrl" onChange={(event) => onChange('homepageControls', 'facebookPageUrl', event.target.value)} value={homepage.facebookPageUrl || ''} />
          <Field label="Typewriter phrases (one per line, max 5)" name="typewriterPhrases" onChange={(event) => onChange('homepageControls', 'typewriterPhrases', fromLines(event.target.value).slice(0, 5))} textarea value={toLines(homepage.typewriterPhrases)} />
          <Field label="Trust badge labels" name="trustBadgeLabels" onChange={(event) => onChange('homepageControls', 'trustBadgeLabels', fromLines(event.target.value))} textarea value={toLines(homepage.trustBadgeLabels)} />
          <Field label="Certificate image URL" name="certificateImageUrl" onChange={(event) => onChange('homepageControls', 'certificateImageUrl', event.target.value)} value={homepage.certificateImageUrl || ''} />
          <div className="flex items-end">
            <FileUploadButton label="Certificate upload" onUpload={(file) => onUploadSetting('homepageControls', 'certificateImageUrl', file)} />
          </div>
        </div>
        <div className="mt-5">
          <Button icon={Save} loading={saving} onClick={onSave}>
            সেটিংস সংরক্ষণ করুন
          </Button>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        {homepageManagerConfigs.map((config) => (
          <Panel key={config.key}>
            <SectionTitle icon={config.icon} title={config.title} />
            <form className="mt-5 grid gap-4" onSubmit={(event) => submitDraft(event, config)}>
              <div className="grid gap-4 md:grid-cols-2">
                {config.fields.map((field) => (
                  <div className={field.textarea ? 'md:col-span-2' : ''} key={field.name}>
                    <Field
                      label={field.label}
                      name={field.name}
                      onChange={(event) =>
                        updateDraft(
                          config.key,
                          field.name,
                          field.type === 'number' ? Number(event.target.value || 0) : event.target.value,
                        )
                      }
                      required={field.required}
                      textarea={field.textarea}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={drafts[config.key]?.[field.name] ?? ''}
                    />
                    {field.type === 'image' ? (
                      <div className="mt-2">
                        <FileUploadButton
                          label="ছবি আপলোড"
                          onUpload={async (file) => {
                            try {
                              const url = await onUploadImage(file, `${config.key}-${Date.now()}`)
                              updateDraft(config.key, field.name, url)
                            } catch (error) {
                              toast.error(getErrorMessage(error))
                            }
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {config.toggles?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {config.toggles.map((toggle) => (
                    <Toggle
                      checked={Boolean(drafts[config.key]?.[toggle.name])}
                      key={toggle.name}
                      label={toggle.label}
                      onChange={(value) => updateDraft(config.key, toggle.name, value)}
                    />
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button icon={Save} type="submit">
                  {drafts[config.key]?._id ? 'আপডেট করুন' : 'যোগ করুন'}
                </Button>
                {drafts[config.key]?._id ? (
                  <Button onClick={() => resetDraft(config.key)} type="button" variant="secondary">
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>

            <div className="mt-6 grid gap-3">
              {(collections[config.key] || []).map((item, index, items) => (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4" key={item._id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-gray-900">{item.name || item.title}</p>
                      <Badge value={item.active === false ? 'default' : 'approved'}>
                        {item.active === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-gray-500">
                      #{index + 1} |{' '}
                      {item.position || item.year || item.joinYear || item.websiteUrl || 'Homepage item'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      disabled={index === 0}
                      icon={ArrowUp}
                      iconOnly
                      onClick={() => moveItem(config, item, -1)}
                      type="button"
                      variant="secondary"
                    >
                      Move up
                    </Button>
                    <Button
                      disabled={index === items.length - 1}
                      icon={ArrowDown}
                      iconOnly
                      onClick={() => moveItem(config, item, 1)}
                      type="button"
                      variant="secondary"
                    >
                      Move down
                    </Button>
                    <Button
                      onClick={() => setDrafts((current) => ({ ...current, [config.key]: item }))}
                      type="button"
                      variant="secondary"
                    >
                      Edit
                    </Button>
                    <Button icon={Trash2} onClick={() => onDelete(config.key, item)} type="button" variant="danger">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {!collections[config.key]?.length ? (
                <p className="rounded-xl bg-gray-50 p-4 text-sm font-semibold text-gray-500">
                  এখনো কোনো আইটেম নেই।
                </p>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function MemberControlsTab({
  activityUser,
  csvImport,
  filter,
  filteredMembers,
  members,
  onActivity,
  onBulkApprove,
  onBulkReject,
  onDelete,
  onExportCsv,
  onExportPdf,
  onFile,
  onFilter,
  onImport,
  onMapping,
  onPasswordReset,
  onRole,
  onStatus,
  onSuspend,
  passwordReset,
  setPasswordReset,
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [selectedPendingIds, setSelectedPendingIds] = useState([])
  const visiblePendingMembers = useMemo(
    () => filteredMembers.filter((user) => user.status === 'pending'),
    [filteredMembers],
  )
  const visiblePendingIds = useMemo(
    () => new Set(visiblePendingMembers.map((user) => user._id)),
    [visiblePendingMembers],
  )
  const selectedVisiblePendingIds = selectedPendingIds.filter((id) => visiblePendingIds.has(id))

  const togglePendingSelection = (userId) => {
    setSelectedPendingIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    )
  }

  const selectVisiblePending = () => {
    setSelectedPendingIds(visiblePendingMembers.map((user) => user._id))
  }

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={UserCog} title="সদস্য নিয়ন্ত্রণ" />
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            disabled={!visiblePendingMembers.length}
            onClick={selectVisiblePending}
            variant="secondary"
          >
            Select visible pending
          </Button>
          <Button
            disabled={!selectedVisiblePendingIds.length}
            icon={CheckCircle2}
            onClick={() => onBulkApprove(selectedVisiblePendingIds)}
          >
            Bulk approve ({selectedVisiblePendingIds.length})
          </Button>
          <Field
            className="min-w-72"
            label="Reject reason"
            name="rejectReason"
            onChange={(event) => setRejectReason(event.target.value)}
            value={rejectReason}
          />
          <Button
            disabled={!selectedVisiblePendingIds.length || !rejectReason.trim()}
            icon={XCircle}
            onClick={() => onBulkReject(rejectReason, selectedVisiblePendingIds)}
            variant="danger"
          >
            Bulk reject ({selectedVisiblePendingIds.length})
          </Button>
          <Button icon={Download} onClick={onExportCsv} variant="secondary">
            CSV export
          </Button>
          <Button icon={FileDown} onClick={onExportPdf} variant="secondary">
            PDF export
          </Button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field
            label="সদস্য খুঁজুন"
            name="memberSearch"
            onChange={(event) => onFilter({ ...filter, query: event.target.value })}
            value={filter.query}
          />
          <SelectField
            label="Status"
            name="status"
            onChange={(event) => onFilter({ ...filter, status: event.target.value })}
            value={filter.status}
          >
            <option value="">সব</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </SelectField>
          <SelectField
            label="Role"
            name="role"
            onChange={(event) => onFilter({ ...filter, role: event.target.value })}
            value={filter.role}
          >
            <option value="">সব</option>
            <option value="member">Member</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </SelectField>
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon={FileInput} title="CSV Import with field mapping" />
        <div className="mt-5 grid gap-4">
          <input
            accept=".csv,text/csv"
            className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700"
            onChange={(event) => onFile(event.target.files?.[0])}
            type="file"
          />
          {csvImport.headers.length ? (
            <>
              <div className="grid gap-4 md:grid-cols-5">
                {['name', 'phone', 'address', 'role', 'status'].map((field) => (
                  <SelectField
                    key={field}
                    label={field}
                    name={field}
                    onChange={(event) =>
                      onMapping({ ...csvImport.mapping, [field]: event.target.value })
                    }
                    value={csvImport.mapping[field]}
                  >
                    <option value="">Skip</option>
                    {csvImport.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </SelectField>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {csvImport.rows.slice(0, 4).map((row, index) => (
                      <tr key={index}>
                        {csvImport.headers.map((header) => (
                          <td className="px-3 py-2 text-gray-600" key={header}>
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button icon={Upload} onClick={onImport}>
                Import {csvImport.rows.length} rows
              </Button>
            </>
          ) : null}
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon={UserCog} title="সদস্য তালিকা ও action" />
        <div className="mt-5 grid gap-3">
          {filteredMembers.map((user) => (
            <div className="grid gap-3 rounded-xl border border-gray-200 p-4 lg:grid-cols-[1fr_auto]" key={user._id}>
              <div className="flex gap-3">
                {user.status === 'pending' ? (
                  <input
                    aria-label={`Select ${user.name}`}
                    checked={selectedPendingIds.includes(user._id)}
                    className="mt-3 h-5 w-5 accent-indigo-600"
                    onChange={() => togglePendingSelection(user._id)}
                    type="checkbox"
                  />
                ) : null}
                <Avatar name={user.name} src={user.profilePhotoUrl} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <Badge value={user.status}>{user.status}</Badge>
                    <Badge value="default">{user.role}</Badge>
                    {user.suspendedAt ? <Badge value="rejected">Suspended</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {user.phone} | {user.address || 'No address'} | Last login {toDate(user.lastLoginAt)}
                  </p>
                  {activityUser?._id === user._id ? (
                    <p className="mt-2 text-sm text-indigo-700">
                      Payments {activityUser.activity.paymentCount}, Events{' '}
                      {activityUser.activity.attendedCount}, Blogs {activityUser.activity.blogCount},
                      Donations {activityUser.activity.donationCount}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <SelectField
                  label="Role"
                  name={`role-${user._id}`}
                  onChange={(event) => onRole(user, event.target.value)}
                  value={user.role}
                >
                  <option value="member">Member</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </SelectField>
                <SelectField
                  label="Status"
                  name={`status-${user._id}`}
                  onChange={(event) => onStatus(user, event.target.value)}
                  value={user.status}
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </SelectField>
                <Button onClick={() => onActivity(user)} variant="secondary">
                  Activity
                </Button>
                <Button onClick={() => onSuspend(user)} variant="secondary">
                  {user.suspendedAt ? 'Unsuspend' : 'Suspend'}
                </Button>
                <Button icon={Trash2} onClick={() => onDelete(user)} variant="danger">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon={Lock} title="পাসওয়ার্ড reset" />
        <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={onPasswordReset}>
          <SelectField
            label="Member"
            name="resetMember"
            onChange={(event) =>
              setPasswordReset((current) => ({ ...current, userId: event.target.value }))
            }
            required
            value={passwordReset.userId}
          >
            <option value="">Select member</option>
            {members.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} | {user.phone}
              </option>
            ))}
          </SelectField>
          <Field
            label="Temporary password"
            name="newPassword"
            onChange={(event) =>
              setPasswordReset((current) => ({ ...current, newPassword: event.target.value }))
            }
            required
            type="password"
            value={passwordReset.newPassword}
          />
          <div className="flex items-end">
            <Button icon={Lock} type="submit">
              Reset password
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

function FinanceControlsTab({
  donations,
  form,
  manualFeeForm,
  members,
  onChange,
  onDonationStatus,
  onExportFinance,
  onManualFee,
  onSave,
  onWaive,
  saving,
  setManualFeeForm,
  setWaiveForm,
  waiveForm,
}) {
  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={WalletCards} title="Finance controls" />
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <SelectField
            label="Monthly fee due date"
            name="monthlyFeeDueDate"
            onChange={(event) =>
              onChange('financeControls', 'monthlyFeeDueDate', Number(event.target.value))
            }
            value={form.financeControls.monthlyFeeDueDate}
          >
            <option value={1}>1st</option>
            <option value={5}>5th</option>
            <option value={10}>10th</option>
          </SelectField>
          <Field
            label="Late fee amount"
            name="lateFeeAmount"
            onChange={(event) =>
              onChange('financeControls', 'lateFeeAmount', Number(event.target.value || 0))
            }
            type="number"
            value={form.financeControls.lateFeeAmount}
          />
          <SelectField
            label="Fiscal year start"
            name="fiscalYearStartMonth"
            onChange={(event) =>
              onChange('financeControls', 'fiscalYearStartMonth', Number(event.target.value))
            }
            value={form.financeControls.fiscalYearStartMonth}
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                Month {index + 1}
              </option>
            ))}
          </SelectField>
          <Toggle
            checked={form.financeControls.lateFeeEnabled}
            label="Late fee চালু"
            onChange={(value) => onChange('financeControls', 'lateFeeEnabled', value)}
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button icon={Save} loading={saving} onClick={onSave}>
            Finance settings save
          </Button>
          <Button icon={FileDown} onClick={onExportFinance} variant="secondary">
            Full finance PDF
          </Button>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle icon={WalletCards} title="Manual fee entry" />
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={onManualFee}>
            <MemberSelect
              members={members}
              onChange={(value) =>
                setManualFeeForm((current) => ({ ...current, userId: value }))
              }
              value={manualFeeForm.userId}
            />
            <Field
              label="Month"
              name="manualMonth"
              onChange={(event) =>
                setManualFeeForm((current) => ({ ...current, month: event.target.value }))
              }
              type="month"
              value={manualFeeForm.month}
            />
            <Field
              label="Amount"
              name="manualAmount"
              onChange={(event) =>
                setManualFeeForm((current) => ({ ...current, amount: event.target.value }))
              }
              type="number"
              value={manualFeeForm.amount}
            />
            <Field
              label="Transaction ID"
              name="manualTransaction"
              onChange={(event) =>
                setManualFeeForm((current) => ({
                  ...current,
                  transactionId: event.target.value,
                }))
              }
              value={manualFeeForm.transactionId}
            />
            <Button className="md:col-span-2" type="submit">
              Save manual fee
            </Button>
          </form>
        </Panel>
        <Panel>
          <SectionTitle icon={WalletCards} title="Fee waive" />
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={onWaive}>
            <MemberSelect
              members={members}
              onChange={(value) => setWaiveForm((current) => ({ ...current, userId: value }))}
              value={waiveForm.userId}
            />
            <Field
              label="Month"
              name="waiveMonth"
              onChange={(event) => setWaiveForm((current) => ({ ...current, month: event.target.value }))}
              type="month"
              value={waiveForm.month}
            />
            <Field
              className="md:col-span-2"
              label="Reason"
              name="waiveReason"
              onChange={(event) =>
                setWaiveForm((current) => ({ ...current, reason: event.target.value }))
              }
              textarea
              value={waiveForm.reason}
            />
            <Button className="md:col-span-2" type="submit" variant="secondary">
              Waive fee
            </Button>
          </form>
        </Panel>
      </div>

      <Panel>
        <SectionTitle icon={WalletCards} title="Donation verification" />
        <div className="mt-5 grid gap-3">
          {donations.slice(0, 12).map((donation) => (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4" key={donation._id}>
              <div>
                <p className="font-semibold text-gray-900">
                  {donation.donorName} | {money(donation.amount)}
                </p>
                <p className="text-sm text-gray-500">
                  {donation.method} | {donation.transactionId} | {donation.phone}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={donation.status}>{donation.status}</Badge>
                <Button onClick={() => onDonationStatus(donation, 'verify')}>Verify</Button>
                <Button onClick={() => onDonationStatus(donation, 'reject')} variant="danger">
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

function MemberSelect({ members, onChange, value }) {
  return (
    <SelectField
      label="Member"
      name="memberId"
      onChange={(event) => onChange(event.target.value)}
      required
      value={value}
    >
      <option value="">Select member</option>
      {members.map((member) => (
        <option key={member._id} value={member._id}>
          {member.name} | {member.phone}
        </option>
      ))}
    </SelectField>
  )
}

function ContentControlsTab({
  archiveForm,
  blogs,
  form,
  gallery,
  meetings,
  notices,
  onArchive,
  onArchiveChange,
  onBlogModerate,
  onCategoryAdd,
  onCategoryRemove,
  onGalleryMove,
  onNoticePin,
  onSave,
  onTemplateAdd,
  rules,
  saving,
}) {
  const [category, setCategory] = useState('')
  const [template, setTemplate] = useState({ agenda: '', title: '' })
  const [albumDrafts, setAlbumDrafts] = useState({})

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={GalleryHorizontalEnd} title="Notice categories and pin/archive" />
        <div className="mt-5 flex flex-wrap gap-2">
          {(form.contentControls.noticeCategories || []).map((item) => (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-indigo-50 px-4 text-sm font-semibold text-indigo-700"
              key={item}
              onClick={() => onCategoryRemove(item)}
              type="button"
            >
              {item}
              <XCircle aria-hidden="true" className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <Field
            label="নতুন category"
            name="noticeCategory"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          />
          <div className="flex items-end">
            <Button
              onClick={() => {
                onCategoryAdd(category)
                setCategory('')
              }}
            >
              Add
            </Button>
          </div>
        </div>
        <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={onArchive}>
          <Field
            label="Archive from"
            name="archiveFrom"
            onChange={(event) => onArchiveChange({ ...archiveForm, from: event.target.value })}
            type="date"
            value={archiveForm.from}
          />
          <Field
            label="Archive to"
            name="archiveTo"
            onChange={(event) => onArchiveChange({ ...archiveForm, to: event.target.value })}
            type="date"
            value={archiveForm.to}
          />
          <div className="flex items-end">
            <Button icon={Archive} type="submit" variant="secondary">
              Bulk archive
            </Button>
          </div>
        </form>
        <div className="mt-5 grid gap-3">
          {notices.slice(0, 8).map((notice) => (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4" key={notice._id}>
              <div>
                <p className="font-semibold text-gray-900">{notice.title}</p>
                <p className="text-sm text-gray-500">
                  Read: {notice.readReceipts?.length || 0} | Reactions:{' '}
                  {notice.reactions?.length || 0} | Comments: {notice.comments?.length || 0}
                </p>
              </div>
              <Button onClick={() => onNoticePin(notice)} variant="secondary">
                {notice.pinned ? 'Unpin' : 'Pin'}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button icon={Save} loading={saving} onClick={onSave}>
            Save content settings
          </Button>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle icon={GalleryHorizontalEnd} title="Meeting templates" />
          <div className="mt-5 grid gap-4">
            <Field
              label="Template title"
              name="templateTitle"
              onChange={(event) => setTemplate((current) => ({ ...current, title: event.target.value }))}
              value={template.title}
            />
            <Field
              label="Agenda"
              name="templateAgenda"
              onChange={(event) => setTemplate((current) => ({ ...current, agenda: event.target.value }))}
              textarea
              value={template.agenda}
            />
            <Button
              onClick={() => {
                onTemplateAdd(template)
                setTemplate({ agenda: '', title: '' })
              }}
            >
              Save template
            </Button>
            {(form.contentControls.meetingTemplates || []).map((item, index) => (
              <div className="rounded-lg bg-gray-50 p-3" key={`${item.title}-${index}`}>
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.agenda}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle icon={GalleryHorizontalEnd} title="Blog moderation" />
          <div className="mt-5 grid gap-3">
            {blogs.slice(0, 10).map((blog) => (
              <div className="rounded-xl border border-gray-200 p-4" key={blog._id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{blog.title}</p>
                    <p className="text-sm text-gray-500">By {blog.createdBy?.name || 'Member'}</p>
                  </div>
                  <Badge value={blog.moderationStatus || 'approved'}>
                    {blog.moderationStatus || 'approved'}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => onBlogModerate(blog, 'approved')}>Approve</Button>
                  <Button onClick={() => onBlogModerate(blog, 'rejected')} variant="danger">
                    Reject
                  </Button>
                  <Button onClick={() => onBlogModerate(blog, 'pending')} variant="secondary">
                    Pending
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle icon={GalleryHorizontalEnd} title="Gallery albums" />
          <div className="mt-5 grid gap-3">
            {gallery.slice(0, 8).map((item) => (
              <div className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[72px_1fr_auto]" key={item._id}>
                <img alt="" className="h-16 w-16 rounded-lg object-cover" src={item.imageUrl} />
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">Album: {item.album || 'General'}</p>
                </div>
                <div className="flex gap-2">
                  <Field
                    label="Album"
                    name={`album-${item._id}`}
                    onChange={(event) =>
                      setAlbumDrafts((current) => ({ ...current, [item._id]: event.target.value }))
                    }
                    value={albumDrafts[item._id] ?? item.album ?? 'General'}
                  />
                  <div className="flex items-end">
                    <Button
                      onClick={() => onGalleryMove(item, albumDrafts[item._id] || item.album || 'General')}
                      variant="secondary"
                    >
                      Move
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle icon={GalleryHorizontalEnd} title="Rules version history" />
          <div className="mt-5 grid gap-3">
            {rules.map((rule) => (
              <div className="rounded-xl border border-gray-200 p-4" key={rule._id}>
                <p className="font-semibold text-gray-900">{rule.title}</p>
                <p className="text-sm text-gray-500">
                  Version {rule.version || 1} | History {rule.versionHistory?.length || 0}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel>
        <SectionTitle icon={GalleryHorizontalEnd} title="Meeting agenda/action status" />
        <div className="mt-5 grid gap-3">
          {meetings.slice(0, 6).map((meeting) => (
            <div className="rounded-xl border border-gray-200 p-4" key={meeting._id}>
              <p className="font-semibold text-gray-900">{meeting.title}</p>
              <p className="text-sm text-gray-500">
                Agenda items {meeting.agendaItems?.length || 0} | Action items{' '}
                {meeting.actionItems?.length || 0} | Attendance mode{' '}
                {meeting.attendanceMode?.active ? 'active' : 'closed'}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function NotificationControlsTab({
  announcementForm,
  form,
  notifications,
  onAnnouncement,
  onAnnouncementChange,
  onChange,
  onSave,
  saving,
  smsBalance,
  users,
}) {
  const triggers = [
    ['smsNoticeEnabled', 'নতুন নোটিশ'],
    ['smsMeetingEnabled', 'মিটিং রিমাইন্ডার'],
    ['smsFeeReminderEnabled', 'মাসিক ফি রিমাইন্ডার'],
    ['whatsappNoticeEnabled', 'WhatsApp notice'],
    ['whatsappMeetingEnabled', 'WhatsApp meeting'],
    ['whatsappFeeReminderEnabled', 'WhatsApp fee'],
    ['meetingReminder24hEnabled', 'Meeting reminder 24h'],
    ['paymentDecisionEnabled', 'Payment approved/rejected'],
    ['registrationDecisionEnabled', 'Registration approved/rejected'],
    ['tourRegistrationOpenEnabled', 'Tour registration open'],
  ]
  const selectedUserIds = announcementForm.userIds || []
  const balanceText = !smsBalance
    ? 'Loading balance...'
    : smsBalance.error
      ? smsBalance.error
      : smsBalance.configured
        ? `${smsBalance.currency || ''} ${smsBalance.balance ?? '0'}`.trim()
        : smsBalance.reason

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={Bell} title="Notification triggers" />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Toggle
            checked={form.notificationSettings.smsGloballyEnabled}
            label="SMS gateway enabled"
            onChange={(value) => onChange('notificationSettings', 'smsGloballyEnabled', value)}
          />
          {triggers.map(([field, label]) => (
            <Toggle
              checked={Boolean(form.notificationSettings[field])}
              key={field}
              label={label}
              onChange={(value) => onChange('notificationSettings', field, value)}
            />
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button icon={Save} loading={saving} onClick={onSave}>
            Save notification settings
          </Button>
        </div>
      </Panel>
      <Panel>
        <SectionTitle icon={Bell} title="Custom announcement" />
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={onAnnouncement}>
          <Field
            label="Title"
            name="announcementTitle"
            onChange={(event) => onAnnouncementChange('title', event.target.value)}
            required
            value={announcementForm.title}
          />
          <SelectField
            label="Recipients"
            name="announcementRecipientMode"
            onChange={(event) => onAnnouncementChange('recipientMode', event.target.value)}
            value={announcementForm.recipientMode}
          >
            <option value="all">All active users</option>
            <option value="active">Active members</option>
            <option value="overdue">Overdue members</option>
            <option value="specific">Specific members</option>
            <option value="member">Member role</option>
            <option value="moderator">Moderators</option>
            <option value="admin">Admins</option>
          </SelectField>
          <SelectField
            label="Channel"
            name="announcementChannel"
            onChange={(event) => onAnnouncementChange('channel', event.target.value)}
            value={announcementForm.channel}
          >
            <option value="in_app">In-app only</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="both">Both</option>
          </SelectField>
          <Field
            label="Schedule for later"
            name="scheduledFor"
            onChange={(event) => onAnnouncementChange('scheduledFor', event.target.value)}
            type="datetime-local"
            value={announcementForm.scheduledFor || ''}
          />
          {announcementForm.recipientMode === 'specific' ? (
            <SelectField
              className="md:col-span-2"
              label="Specific members"
              multiple
              name="announcementUserIds"
              onChange={(event) =>
                onAnnouncementChange(
                  'userIds',
                  Array.from(event.target.selectedOptions, (option) => option.value),
                )
              }
              value={selectedUserIds}
            >
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} - {user.phone}
                </option>
              ))}
            </SelectField>
          ) : null}
          <div className="md:col-span-2">
            <RichTextEditor
              label="Message"
              onChange={(value) => onAnnouncementChange('message', value)}
              value={announcementForm.message}
            />
          </div>
          <Button className="md:col-span-2" icon={Bell} type="submit">
            {announcementForm.scheduledFor ? 'Schedule announcement' : 'Send now'}
          </Button>
        </form>
      </Panel>
      <Panel>
        <SectionTitle icon={Bell} title="Notification history and SMS balance" />
        <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm font-semibold text-indigo-700">
          SMS balance: {balanceText}
        </p>
        <p className="hidden">
          SMS balance: Gateway API credentials configured হলে এখানে live balance দেখানো যাবে।
        </p>
        <div className="mt-4 grid gap-3">
          {notifications.slice(0, 12).map((notification) => (
            <div className="rounded-xl border border-gray-200 p-4" key={notification._id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">{notification.title}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    value={
                      notification.deliveryStatus === 'failed'
                        ? 'rejected'
                        : notification.deliveryStatus || 'approved'
                    }
                  >
                    {notification.deliveryStatus || 'sent'}
                  </Badge>
                  <Badge value={notification.readAt ? 'approved' : 'pending'}>
                    {notification.readAt ? 'Read' : 'Unread'}
                  </Badge>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {notification.user?.name || 'All'} | {notification.channel || 'in_app'} |{' '}
                {toDate(notification.sentAt || notification.scheduledFor || notification.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function AppearanceTab({ form, onChange, onPreview, onSave, onUpload, saving }) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
      <Panel>
        <SectionTitle icon={Palette} title="Accent color" />
        <div className="mt-5">
          <HexColorPicker
            color={form.appearance.primaryColor}
            onChange={(value) => onChange('appearance', 'primaryColor', value)}
          />
          <Field
            className="mt-4"
            label="Primary color"
            name="primaryColor"
            onChange={(event) => onChange('appearance', 'primaryColor', event.target.value)}
            value={form.appearance.primaryColor}
          />
        </div>
      </Panel>
      <Panel>
        <SectionTitle icon={Palette} title="Appearance controls" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Dark mode"
            name="colorMode"
            onChange={(event) => onChange('appearance', 'colorMode', event.target.value)}
            value={form.appearance.colorMode}
          >
            <option value="light">Force light</option>
            <option value="dark">Force dark</option>
            <option value="system">Follow system</option>
          </SelectField>
          <SelectField
            label="Font size"
            name="fontSize"
            onChange={(event) => onChange('appearance', 'fontSize', event.target.value)}
            value={form.appearance.fontSize}
          >
            <option value="normal">Normal</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </SelectField>
          <Field
            label="Homepage hero image URL"
            name="heroImageUrl"
            onChange={(event) => onChange('appearance', 'heroImageUrl', event.target.value)}
            value={form.appearance.heroImageUrl}
          />
          <div className="flex items-end">
            <FileUploadButton
              label="Hero image upload"
              onUpload={(file) => onUpload('appearance', 'heroImageUrl', file)}
            />
          </div>
          <Field
            className="md:col-span-2"
            label="Custom CSS"
            name="customCss"
            onChange={(event) => onChange('appearance', 'customCss', event.target.value)}
            textarea
            value={form.appearance.customCss}
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button icon={Eye} onClick={onPreview} variant="secondary">
            Preview
          </Button>
          <Button icon={Save} loading={saving} onClick={onSave}>
            Save appearance
          </Button>
        </div>
      </Panel>
    </div>
  )
}

function SecurityTab({
  form,
  onAuditExport,
  onBackup,
  onChange,
  onForceLogout,
  onPasswordChange,
  onSave,
  recentActivity,
  saving,
  users,
}) {
  const [auditFilter, setAuditFilter] = useState({ action: '', actor: '' })
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: '',
    currentPassword: '',
    newPassword: '',
  })
  const filteredActivity = recentActivity.filter((log) => {
    const matchesAction = auditFilter.action
      ? String(log.action || '').toLowerCase().includes(auditFilter.action.toLowerCase())
      : true
    const actor = `${log.actor?.name || 'System'} ${log.actor?.phone || ''}`.toLowerCase()
    const matchesActor = auditFilter.actor
      ? actor.includes(auditFilter.actor.toLowerCase())
      : true

    return matchesAction && matchesActor
  })
  const failedLogins = recentActivity.filter((log) => log.action === 'auth.login.failed')

  const submitPasswordChange = async (event) => {
    event.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }

    await onPasswordChange({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    setPasswordForm({ confirmPassword: '', currentPassword: '', newPassword: '' })
  }

  return (
    <div className="mt-6 grid gap-6">
      <Panel>
        <SectionTitle icon={Lock} title="Security controls" />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <SelectField
            label="Auto backup schedule"
            name="autoBackupSchedule"
            onChange={(event) =>
              onChange('securityControls', 'autoBackupSchedule', event.target.value)
            }
            value={form.securityControls.autoBackupSchedule}
          >
            <option value="off">Off</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </SelectField>
          <Toggle
            checked={form.securityControls.twoFactorRequiredForAdmins}
            label="Admin 2FA required"
            onChange={(value) =>
              onChange('securityControls', 'twoFactorRequiredForAdmins', value)
            }
          />
          <Field
            label="IP whitelist"
            name="adminIpWhitelist"
            onChange={(event) =>
              onChange(
                'securityControls',
                'adminIpWhitelist',
                event.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Comma separated"
            value={(form.securityControls.adminIpWhitelist || []).join(', ')}
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button icon={DatabaseBackup} onClick={onBackup} variant="secondary">
            Manual JSON backup
          </Button>
          <Button icon={FileDown} onClick={onAuditExport} variant="secondary">
            Export audit CSV
          </Button>
          <Button icon={Save} loading={saving} onClick={onSave}>
            Save security
          </Button>
        </div>
      </Panel>
      <Panel>
        <SectionTitle icon={Lock} title="Admin password change" />
        <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={submitPasswordChange}>
          <Field
            label="Current password"
            name="currentPassword"
            onChange={(event) =>
              setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
            }
            required
            type="password"
            value={passwordForm.currentPassword}
          />
          <Field
            label="New password"
            name="newPassword"
            onChange={(event) =>
              setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
            }
            required
            type="password"
            value={passwordForm.newPassword}
          />
          <Field
            label="Confirm password"
            name="confirmPassword"
            onChange={(event) =>
              setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
            }
            required
            type="password"
            value={passwordForm.confirmPassword}
          />
          <Button className="md:col-span-3" icon={Lock} type="submit">
            Change password
          </Button>
        </form>
      </Panel>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <SectionTitle icon={Lock} title="Active sessions / last login" />
          <div className="mt-5 grid gap-3">
            {users.slice(0, 12).map((user) => (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4" key={user._id}>
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">
                    IP {user.lastLoginIp || 'N/A'} | {toDate(user.lastLoginAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge value={user.status}>{user.status}</Badge>
                  <Button
                    disabled={!user.lastLoginAt}
                    onClick={() => onForceLogout(user)}
                    size="sm"
                    variant="danger"
                  >
                    Force logout
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle icon={Lock} title="Audit/Admin activity log" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field
              label="Filter by action"
              name="auditAction"
              onChange={(event) =>
                setAuditFilter((current) => ({ ...current, action: event.target.value }))
              }
              value={auditFilter.action}
            />
            <Field
              label="Filter by actor"
              name="auditActor"
              onChange={(event) =>
                setAuditFilter((current) => ({ ...current, actor: event.target.value }))
              }
              value={auditFilter.actor}
            />
          </div>
          <div className="mt-5 grid gap-3">
            {filteredActivity.map((log) => (
              <div className="rounded-xl border border-gray-200 p-4" key={log._id}>
                <p className="font-semibold text-gray-900">{log.action}</p>
                <p className="text-sm text-gray-500">
                  {log.actor?.name || 'System'} | IP {log.ip || 'N/A'} | {toDate(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel>
        <SectionTitle icon={Lock} title="Failed login attempts" />
        <div className="mt-5 grid gap-3">
          {failedLogins.map((log) => (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4" key={log._id}>
              <p className="font-semibold text-red-900">
                {log.metadata?.identifier || 'Unknown identifier'}
              </p>
              <p className="text-sm text-red-700">
                IP {log.ip || 'N/A'} | {toDate(log.createdAt)}
              </p>
            </div>
          ))}
          {!failedLogins.length ? (
            <p className="rounded-xl bg-gray-50 p-4 text-sm font-semibold text-gray-500">
              No failed login attempts in the recent audit window.
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  )
}
