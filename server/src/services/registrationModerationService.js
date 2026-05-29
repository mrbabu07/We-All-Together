const mongoose = require('mongoose')
const { PAYMENT_STATUSES } = require('../constants/paymentConstants')
const { USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('./auditService')
const { createNotification } = require('./notificationService')
const { getSettings } = require('./settingsService')
const { sendTextMessage } = require('./smsService')

const readModerationUserIds = (userIds) => {
  if (userIds === undefined) {
    return null
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError('Select at least one pending registration.', 400)
  }

  const normalized = userIds.map((id) => id?.toString()).filter(Boolean)
  const invalid = normalized.find((id) => !mongoose.isValidObjectId(id))

  if (invalid) {
    throw new AppError('One or more selected registrations are invalid.', 400)
  }

  return [...new Set(normalized)]
}

const findPendingRegistrations = async (userIds) => {
  const selectedIds = readModerationUserIds(userIds)
  const filter = { status: USER_STATUSES.PENDING }

  if (selectedIds) {
    filter._id = { $in: selectedIds }
  }

  const users = await User.find(filter)

  if (selectedIds && users.length !== selectedIds.length) {
    throw new AppError('One or more selected registrations are no longer pending.', 400)
  }

  if (users.length === 0) {
    throw new AppError('No pending registrations matched this action.', 404)
  }

  return users
}

const approvePendingRegistrations = async ({ actor, userIds }) => {
  const [users, settings] = await Promise.all([findPendingRegistrations(userIds), getSettings()])
  const approvedAt = new Date()
  const smsResults = []

  for (const user of users) {
    user.status = USER_STATUSES.APPROVED
    user.approvedAt = approvedAt
    user.approvedBy = actor._id
    user.rejectedAt = null
    user.rejectedBy = null
    user.registrationPayment.status = PAYMENT_STATUSES.VERIFIED
    user.registrationPayment.verifiedAt = approvedAt
    user.registrationPayment.verifiedBy = actor._id
    await user.save()

    if (settings.notificationSettings?.registrationDecisionEnabled !== false) {
      await createNotification({
        createdBy: actor,
        link: '/member',
        message: 'Your registration has been approved. You can now access member features.',
        title: 'Registration approved',
        type: 'registration',
        user,
      })
    }

    smsResults.push(
      await sendTextMessage({
        body: 'Welcome to Dargah Para Oikko Porishod. Your registration has been approved.',
        phone: user.phone,
      }),
    )
  }

  await recordAuditLog({
    action: users.length === 1 ? 'registration.approve' : 'registration.bulk.approve',
    actor,
    entityId: users.length === 1 ? users[0]._id : undefined,
    entityType: 'User',
    metadata: {
      count: users.length,
      phones: users.map((user) => user.phone),
      smsResults,
    },
  })

  return {
    modifiedCount: users.length,
    smsResults,
    users,
  }
}

const rejectPendingRegistrations = async ({ actor, reason, userIds }) => {
  const trimmedReason = typeof reason === 'string' ? reason.trim() : ''

  if (!trimmedReason) {
    throw new AppError('Reject reason is required.', 400)
  }

  const [users, settings] = await Promise.all([findPendingRegistrations(userIds), getSettings()])
  const rejectedAt = new Date()

  for (const user of users) {
    user.status = USER_STATUSES.REJECTED
    user.rejectedAt = rejectedAt
    user.rejectedBy = actor._id
    user.registrationPayment.status = PAYMENT_STATUSES.REJECTED
    user.registrationPayment.note = trimmedReason
    await user.save()

    if (settings.notificationSettings?.registrationDecisionEnabled !== false) {
      await createNotification({
        createdBy: actor,
        link: '/rejected',
        message: `Your registration was rejected. Reason: ${trimmedReason}`,
        title: 'Registration rejected',
        type: 'registration',
        user,
      })
    }
  }

  await recordAuditLog({
    action: users.length === 1 ? 'registration.reject' : 'registration.bulk.reject',
    actor,
    entityId: users.length === 1 ? users[0]._id : undefined,
    entityType: 'User',
    metadata: {
      count: users.length,
      phones: users.map((user) => user.phone),
      reason: trimmedReason,
    },
  })

  return {
    modifiedCount: users.length,
    users,
  }
}

module.exports = {
  approvePendingRegistrations,
  rejectPendingRegistrations,
}
