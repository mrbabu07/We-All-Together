const Notification = require('../models/Notification')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { broadcastNotification } = require('../services/notificationService')
const { validateBroadcastNotification } = require('../validators/notificationValidators')

const getMyNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .populate('createdBy', 'name phone role')
      .sort({ createdAt: -1 })
      .limit(100),
    Notification.countDocuments({ user: req.user._id, readAt: null }),
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
    user: req.user._id,
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
    { user: req.user._id, readAt: null },
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

module.exports = {
  getAllNotifications,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  sendBroadcastNotification,
}
