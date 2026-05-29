const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const Notification = require('../models/Notification')
const User = require('../models/User')
const { calculateMemberFees } = require('../utils/feeCalculator')
const { getSettings } = require('./settingsService')
const { createNotification } = require('./notificationService')
const { sendBulkTextMessages, sendTextMessage } = require('./smsService')

const activeMemberFilter = {
  softDeletedAt: null,
  status: USER_STATUSES.APPROVED,
  suspendedAt: null,
}

const getExternalChannels = (channel) => {
  if (channel === 'both') {
    return ['sms', 'whatsapp']
  }

  return channel === 'in_app' ? [] : [channel]
}

const getDisabledGatewayResults = ({ channels, phones }) =>
  channels.flatMap((channel) =>
    phones.map((phone) => ({
      channel,
      phone,
      provider: 'twilio',
      reason: 'SMS gateway is disabled in notification settings.',
      skipped: true,
    })),
  )

const toPlainText = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const getApprovedRecipients = async (options = '') => {
  const normalized = typeof options === 'string' ? { role: options } : options
  const {
    recipientMode = normalized.role || 'all',
    role = '',
    settings = null,
    userIds = [],
  } = normalized
  const filter = {
    ...activeMemberFilter,
  }
  const targetRole = Object.values(USER_ROLES).includes(recipientMode) ? recipientMode : role

  if (targetRole) {
    filter.role = targetRole
  }

  if (recipientMode === 'specific') {
    filter._id = { $in: userIds }
  }

  const recipients = await User.find(filter).select('_id name phone role approvedAt notificationPreferences')

  if (recipientMode !== 'overdue') {
    return recipients
  }

  const activeSettings = settings || (await getSettings())
  const overdueRecipients = []

  for (const recipient of recipients) {
    const feeStatus = await calculateMemberFees({ member: recipient, settings: activeSettings })
    if (feeStatus.isOverdue) {
      overdueRecipients.push(recipient)
    }
  }

  return overdueRecipients
}

const sendManualMessageNotification = async ({
  actor,
  channel = 'in_app',
  link = '/notifications',
  message,
  recipientMode = 'all',
  role = '',
  scheduledFor = null,
  title,
  type = 'announcement',
  userIds = [],
}) => {
  const settings = await getSettings()
  const recipients = await getApprovedRecipients({
    recipientMode,
    role,
    settings,
    userIds,
  })
  const isScheduled = scheduledFor && scheduledFor > new Date()
  const deliveryStatus = isScheduled ? 'scheduled' : 'sent'
  const sentAt = isScheduled ? null : new Date()
  const notifications = await Promise.all(
    recipients.map((user) =>
      createNotification({
        channel,
        createdBy: actor,
        deliveryStatus,
        link,
        message,
        recipientMode,
        scheduledFor,
        sentAt,
        title,
        type,
        user,
      }),
    ),
  )

  if (isScheduled) {
    return {
      deliveryResults: [],
      notificationCount: notifications.filter(Boolean).length,
      recipientCount: recipients.length,
      scheduled: true,
      scheduledFor,
    }
  }

  const channels = getExternalChannels(channel)
  const deliveryResults = []
  const phones = recipients.map((user) => user.phone)

  if (channels.length && settings.notificationSettings?.smsGloballyEnabled === false) {
    deliveryResults.push(...getDisabledGatewayResults({ channels, phones }))
  } else {
    for (const nextChannel of channels) {
      deliveryResults.push(
        ...(await sendBulkTextMessages({
          body: `${title}: ${toPlainText(message)}`,
          channel: nextChannel,
          phones,
        })),
      )
    }
  }

  const notificationIds = notifications.filter(Boolean).map((notification) => notification._id)
  if (notificationIds.length) {
    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      {
        $set: {
          deliveryResults,
          deliveryStatus: deliveryResults.some((result) => result.error) ? 'failed' : 'sent',
        },
      },
    )
  }

  return {
    deliveryResults,
    notificationCount: notifications.filter(Boolean).length,
    recipientCount: recipients.length,
  }
}

const sendContentTriggerMessages = async ({ actor, body, link, title, trigger }) => {
  const settings = await getSettings()
  const notificationSettings = settings.notificationSettings || {}
  const channels = []

  if (trigger === 'notice' && notificationSettings.smsNoticeEnabled) {
    channels.push('sms')
  }
  if (trigger === 'notice' && notificationSettings.whatsappNoticeEnabled) {
    channels.push('whatsapp')
  }
  if (trigger === 'meeting' && notificationSettings.smsMeetingEnabled) {
    channels.push('sms')
  }
  if (trigger === 'meeting' && notificationSettings.whatsappMeetingEnabled) {
    channels.push('whatsapp')
  }

  if (!channels.length) {
    return {
      deliveryResults: [],
      recipientCount: 0,
      skipped: true,
    }
  }

  const recipients = await getApprovedRecipients()
  const deliveryResults = []

  await Promise.all(
    recipients.map((user) =>
      createNotification({
        createdBy: actor,
        link,
        message: body,
        title,
        type: trigger,
        user,
      }),
    ),
  )

  for (const channel of channels) {
    deliveryResults.push(
      ...(await sendBulkTextMessages({
        body: `${title}: ${body}`,
        channel,
        phones: recipients.map((user) => user.phone),
      })),
    )
  }

  return {
    deliveryResults,
    recipientCount: recipients.length,
    skipped: false,
  }
}

const sendFeeReminderMessages = async ({ actor = null } = {}) => {
  const settings = await getSettings()
  const notificationSettings = settings.notificationSettings || {}
  const channels = []

  if (notificationSettings.smsFeeReminderEnabled) {
    channels.push('sms')
  }
  if (notificationSettings.whatsappFeeReminderEnabled) {
    channels.push('whatsapp')
  }

  if (!channels.length) {
    return {
      deliveryResults: [],
      recipientCount: 0,
      skipped: true,
    }
  }

  const recipients = await getApprovedRecipients('member')
  const title = 'Monthly fee reminder'
  const message = `Please submit this month's member fee of Tk ${Number(
    settings.monthlyFee || 0,
  ).toLocaleString('en-US')}.`
  const deliveryResults = []

  await Promise.all(
    recipients.map((user) =>
      createNotification({
        createdBy: actor,
        link: '/member',
        message,
        title,
        type: 'payment',
        user,
      }),
    ),
  )

  for (const channel of channels) {
    deliveryResults.push(
      ...(await sendBulkTextMessages({
        body: `${title}: ${message}`,
        channel,
        phones: recipients.map((user) => user.phone),
      })),
    )
  }

  return {
    deliveryResults,
    recipientCount: recipients.length,
    skipped: false,
  }
}

const runScheduledFeeReminder = async (referenceDate = new Date()) => {
  if (referenceDate.getDate() !== 1) {
    return {
      skipped: true,
      reason: 'Fee reminders only run on the first day of the month.',
    }
  }

  const settings = await getSettings()
  const month = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(
    2,
    '0',
  )}`

  if (settings.notificationSettings?.lastFeeReminderMonth === month) {
    return {
      skipped: true,
      reason: 'Fee reminder already sent for this month.',
    }
  }

  const result = await sendFeeReminderMessages()
  settings.notificationSettings = {
    ...settings.notificationSettings,
    lastFeeReminderMonth: month,
  }
  await settings.save()

  return result
}

const dispatchScheduledMessageNotifications = async () => {
  const settings = await getSettings()
  const dueNotifications = await Notification.find({
    deliveryStatus: 'scheduled',
    scheduledFor: { $lte: new Date() },
  })
    .populate('user', 'phone')
    .sort({ scheduledFor: 1 })
    .limit(100)

  for (const notification of dueNotifications) {
    const channels = getExternalChannels(notification.channel)
    const deliveryResults = []
    const phone = notification.user?.phone

    if (channels.length && settings.notificationSettings?.smsGloballyEnabled === false) {
      deliveryResults.push(...getDisabledGatewayResults({ channels, phones: [phone].filter(Boolean) }))
    } else {
      for (const channel of channels) {
        if (!phone) {
          deliveryResults.push({
            channel,
            reason: 'Recipient phone is missing.',
            skipped: true,
          })
          continue
        }

        deliveryResults.push(
          await sendTextMessage({
            body: `${notification.title}: ${toPlainText(notification.message)}`,
            channel,
            phone,
          }),
        )
      }
    }

    notification.deliveryResults = deliveryResults
    notification.deliveryStatus = deliveryResults.some((result) => result.error) ? 'failed' : 'sent'
    notification.sentAt = new Date()
    await notification.save()
  }

  return {
    processedCount: dueNotifications.length,
  }
}

const startMonthlyFeeReminderScheduler = () => {
  const run = () => {
    runScheduledFeeReminder().catch((error) => {
      console.error(`Fee reminder scheduler failed: ${error.message}`)
    })
  }

  run()
  return setInterval(run, 1000 * 60 * 60 * 6)
}

const startScheduledNotificationDispatcher = () => {
  const run = () => {
    dispatchScheduledMessageNotifications().catch((error) => {
      console.error(`Scheduled notification dispatcher failed: ${error.message}`)
    })
  }

  run()
  return setInterval(run, 1000 * 60)
}

module.exports = {
  dispatchScheduledMessageNotifications,
  runScheduledFeeReminder,
  sendContentTriggerMessages,
  sendFeeReminderMessages,
  sendManualMessageNotification,
  startMonthlyFeeReminderScheduler,
  startScheduledNotificationDispatcher,
}
