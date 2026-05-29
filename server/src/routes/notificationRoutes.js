const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  getAllNotifications,
  getMyNotifications,
  getSmsBalance,
  markAllNotificationsRead,
  markNotificationRead,
  sendBroadcastNotification,
  sendNotificationMessage,
} = require('../controllers/notificationController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/my', protect, getMyNotifications)
router.patch('/my/read-all', protect, markAllNotificationsRead)
router.get('/sms-balance', protect, authorize(USER_ROLES.ADMIN), getSmsBalance)
router.patch('/:id/read', protect, markNotificationRead)
router.get('/', protect, authorize(USER_ROLES.ADMIN), getAllNotifications)
router.post('/broadcast', protect, authorize(USER_ROLES.ADMIN), sendBroadcastNotification)
router.post('/send', protect, authorize(USER_ROLES.ADMIN), sendNotificationMessage)

module.exports = router
