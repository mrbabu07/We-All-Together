const cron = require('node-cron')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const { getSettings } = require('../services/settingsService')
const { createNotification } = require('../services/notificationService')
const { sendBulkTextMessages } = require('../services/smsService')
const { recordAuditLog } = require('../services/auditService')
const {
  BENGALI_MONTHS,
  calculateMemberFees,
  getCurrentMonth,
  hasPaidMonth,
  toTaka,
} = require('../utils/feeCalculator')

const memberFilter = {
  role: { $in: [USER_ROLES.MEMBER, USER_ROLES.MODERATOR] },
  softDeletedAt: null,
  status: USER_STATUSES.APPROVED,
  suspendedAt: null,
}

const getMembers = () => User.find(memberFilter).select('name phone approvedAt notificationPreferences')

const createFeeNotification = ({ member, message, title, type }) =>
  createNotification({
    link: '/member/fee-history',
    message,
    title,
    type,
    user: member,
  })

const runOverdueDetection = async (referenceDate = new Date()) => {
  const [settings, members] = await Promise.all([getSettings(), getMembers()])
  const overdueMembers = []

  if (settings.feeOverdueAlertEnabled === false) {
    return { skipped: true, reason: 'Overdue alerts disabled.' }
  }

  for (const member of members) {
    const status = await calculateMemberFees({ member, referenceDate, settings })

    if (!status.isOverdue) {
      continue
    }

    overdueMembers.push({ member, status })
    await createFeeNotification({
      member,
      message: `আপনার ${status.overdueMonths.length} মাসের ফি বকেয়া রয়েছে। মোট বকেয়া: ৳${status.totalDue.toLocaleString('bn-BD')}`,
      title: 'ফি বকেয়া',
      type: 'fee_overdue',
    })
  }

  const smsEnabled = Boolean(settings.notificationSettings?.smsFeeReminderEnabled)
  let deliveryResults = []

  if (smsEnabled && overdueMembers.length) {
    deliveryResults = await sendBulkTextMessages({
      body: 'আপনার সদস্য ফি বকেয়া রয়েছে। অনুগ্রহ করে ড্যাশবোর্ডে গিয়ে পরিশোধ করুন।',
      channel: 'sms',
      phones: overdueMembers
        .filter((row) => row.member.notificationPreferences?.sms !== false)
        .map((row) => row.member.phone),
    })
  }

  await recordAuditLog({
    action: 'fee.overdue.check',
    entityType: 'FeePayment',
    metadata: {
      notified: overdueMembers.length,
      smsSent: deliveryResults.filter((row) => !row.skipped).length,
      totalMembers: members.length,
    },
  })

  return {
    deliveryResults,
    notified: overdueMembers.length,
    totalMembers: members.length,
  }
}

const runFeeReminder = async ({ stage = 'fee_reminder', referenceDate = new Date() } = {}) => {
  const [settings, members] = await Promise.all([getSettings(), getMembers()])
  const current = getCurrentMonth(referenceDate)
  const recipients = []

  for (const member of members) {
    const status = await calculateMemberFees({ member, referenceDate, settings })
    if (!hasPaidMonth(status.payments, current) && !status.currentMonthWaived) {
      recipients.push(member)
    }
  }

  const date = `${settings.feeDueDay || 1}/${current.month}/${current.year}`
  const title = stage === 'fee_final_warning' ? 'চূড়ান্ত ফি সতর্কতা' : 'মাসিক ফি রিমাইন্ডার'
  const message =
    stage === 'fee_final_warning'
      ? `আজকের পর এই মাসের ফি বকেয়া হিসেবে গণ্য হবে। মোট ফি: ৳${toTaka(settings.monthlyFeeAmount || settings.monthlyFee * 100).toLocaleString('bn-BD')}`
      : `এই মাসের ফি পরিশোধের শেষ তারিখ ${date}। এখনই পরিশোধ করুন।`

  await Promise.all(
    recipients.map((member) =>
      createFeeNotification({
        member,
        message,
        title,
        type: 'fee_reminder',
      }),
    ),
  )

  let deliveryResults = []
  if (settings.notificationSettings?.smsFeeReminderEnabled && recipients.length) {
    deliveryResults = await sendBulkTextMessages({
      body: `${title}: ${message}`,
      channel: 'sms',
      phones: recipients.map((member) => member.phone),
    })
  }

  await recordAuditLog({
    action: `fee.reminder.${stage}`,
    entityType: 'FeePayment',
    metadata: {
      recipients: recipients.length,
      smsSent: deliveryResults.filter((row) => !row.skipped).length,
    },
  })

  return { deliveryResults, recipients: recipients.length }
}

const startOverdueCheckerJob = () => {
  cron.schedule('0 9 2 * *', () => {
    runOverdueDetection().catch((error) => {
      console.error(`Overdue checker failed: ${error.message}`)
    })
  })
  cron.schedule('0 8 1 * *', () => {
    runFeeReminder({ stage: 'first' }).catch((error) => {
      console.error(`Fee reminder failed: ${error.message}`)
    })
  })
  cron.schedule('0 8 8 * *', () => {
    runFeeReminder({ stage: 'second' }).catch((error) => {
      console.error(`Fee reminder failed: ${error.message}`)
    })
  })
  cron.schedule('0 8 15 * *', () => {
    runFeeReminder({ stage: 'fee_final_warning' }).catch((error) => {
      console.error(`Fee final warning failed: ${error.message}`)
    })
  })
}

module.exports = {
  runFeeReminder,
  runOverdueDetection,
  startOverdueCheckerJob,
}
