const express = require('express')
const {
  deleteMyNotification,
  getAllNotifications,
  getMyNotifications,
  getSmsBalance,
  markAllNotificationsRead,
  markNotificationRead,
  sendBroadcastNotification,
  sendNotificationMessage,
} = require('../controllers/notificationController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')

const router = express.Router()

router.get('/my', protect, getMyNotifications)
router.patch('/my/read-all', protect, markAllNotificationsRead)
router.get('/sms-balance', protect, requirePermission('notification.view_log'), getSmsBalance)
router.patch('/:id/read', protect, markNotificationRead)
router.delete('/:id', protect, deleteMyNotification)
router.get('/', protect, requirePermission('notification.view_log'), getAllNotifications)
router.post('/broadcast', protect, requirePermission('notification.send'), sendBroadcastNotification)
router.post('/send', protect, requirePermission('notification.send'), sendNotificationMessage)

module.exports = router
