const { USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const { getSettings } = require('./settingsService')
const { createNotification } = require('./notificationService')
const { sendBulkTextMessages } = require('./smsService')

const getApprovedRecipients = async (role = '') => {
  const filter = {
    status: USER_STATUSES.APPROVED,
  }

  if (role) {
    filter.role = role
  }

  return User.find(filter).select('_id name phone role')
}

const sendManualMessageNotification = async ({
  actor,
  channel = 'sms',
  link = '/notifications',
  message,
  role = '',
  title,
}) => {
  const recipients = await getApprovedRecipients(role)
  const notifications = await Promise.all(
    recipients.map((user) =>
      createNotification({
        createdBy: actor,
        link,
        message,
        title,
        type: 'message',
        user,
      }),
    ),
  )

  const channels = channel === 'both' ? ['sms', 'whatsapp'] : [channel]
  const deliveryResults = []

  for (const nextChannel of channels) {
    deliveryResults.push(
      ...(await sendBulkTextMessages({
        body: `${title}: ${message}`,
        channel: nextChannel,
        phones: recipients.map((user) => user.phone),
      })),
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

const startMonthlyFeeReminderScheduler = () => {
  const run = () => {
    runScheduledFeeReminder().catch((error) => {
      console.error(`Fee reminder scheduler failed: ${error.message}`)
    })
  }

  run()
  return setInterval(run, 1000 * 60 * 60 * 6)
}

module.exports = {
  runScheduledFeeReminder,
  sendContentTriggerMessages,
  sendFeeReminderMessages,
  sendManualMessageNotification,
  startMonthlyFeeReminderScheduler,
}
