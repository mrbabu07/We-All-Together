const Notification = require('../models/Notification')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { broadcastNotification } = require('../services/notificationService')
const { sendManualMessageNotification } = require('../services/messageNotificationService')
const { getSmsGatewayBalance } = require('../services/smsService')
const {
  validateBroadcastNotification,
  validateSendNotification,
} = require('../validators/notificationValidators')

const visibleNotificationFilter = (userId) => ({
  user: userId,
  $or: [
    { deliveryStatus: { $ne: 'scheduled' } },
    { scheduledFor: null },
    { scheduledFor: { $lte: new Date() } },
  ],
})

const getMyNotifications = asyncHandler(async (req, res) => {
  const filter = visibleNotificationFilter(req.user._id)
  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('createdBy', 'name phone role')
      .sort({ createdAt: -1 })
      .limit(100),
    Notification.countDocuments({ ...filter, readAt: null }),
  ])

  res.status(200).json({
    success: true,
    message: 'Notifications loaded successfully.',
    data: {
      notifications,
      unreadCount,
    },
  })
})

const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find()
    .populate('user', 'name phone role status')
    .populate('createdBy', 'name phone role')
    .sort({ createdAt: -1 })
    .limit(200)

  res.status(200).json({
    success: true,
    message: 'Notifications loaded successfully.',
    data: {
      notifications,
    },
  })
})

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    ...visibleNotificationFilter(req.user._id),
  })

  if (!notification) {
    throw new AppError('Notification not found.', 404)
  }

  notification.readAt = notification.readAt || new Date()
  await notification.save()

  res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
    data: {
      notification,
    },
  })
})

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { ...visibleNotificationFilter(req.user._id), readAt: null },
    { $set: { readAt: new Date() } },
  )

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
    data: {
      modifiedCount: result.modifiedCount,
    },
  })
})

const deleteMyNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    ...visibleNotificationFilter(req.user._id),
  })

  if (!notification) {
    throw new AppError('Notification not found.', 404)
  }

  await notification.deleteOne()

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully.',
    data: {
      id: req.params.id,
    },
  })
})

const sendBroadcastNotification = asyncHandler(async (req, res) => {
  const payload = validateBroadcastNotification(req.body)
  const count = await broadcastNotification({
    ...payload,
    createdBy: req.user._id,
  })

  await recordAuditLog({
    action: 'notification.broadcast',
    actor: req.user,
    entityType: 'Notification',
    metadata: {
      count,
      role: payload.role || 'all',
      title: payload.title,
      type: payload.type,
    },
  })

  res.status(201).json({
    success: true,
    message: 'Notification sent successfully.',
    data: {
      count,
    },
  })
})

const sendNotificationMessage = asyncHandler(async (req, res) => {
  const payload = validateSendNotification(req.body)
  const result = await sendManualMessageNotification({
    ...payload,
    actor: req.user,
  })

  await recordAuditLog({
    action: 'notification.message.send',
    actor: req.user,
    entityType: 'Notification',
    metadata: {
      channel: payload.channel,
      recipientCount: result.recipientCount,
      recipientMode: payload.recipientMode,
      role: payload.role || 'all',
      scheduled: Boolean(result.scheduled),
      scheduledFor: payload.scheduledFor,
      title: payload.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Notification message processed successfully.',
    data: result,
  })
})

const getSmsBalance = asyncHandler(async (req, res) => {
  const balance = await getSmsGatewayBalance()

  res.status(200).json({
    success: true,
    message: 'SMS balance loaded successfully.',
    data: {
      balance,
    },
  })
})

module.exports = {
  deleteMyNotification,
  getAllNotifications,
  getMyNotifications,
  getSmsBalance,
  markAllNotificationsRead,
  markNotificationRead,
  sendBroadcastNotification,
  sendNotificationMessage,
}
