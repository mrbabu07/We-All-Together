const express = require('express')
const {
  getPublicSettings,
  updateDonationNumber,
  updateMonthlyFee,
  updateNotificationSettings,
  updateRegistrationFee,
} = require('../controllers/settingsController')
const { USER_ROLES } = require('../constants/userConstants')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/public', getPublicSettings)
router.patch('/registration-fee', protect, authorize(USER_ROLES.ADMIN), updateRegistrationFee)
router.patch('/monthly-fee', protect, authorize(USER_ROLES.ADMIN), updateMonthlyFee)
router.patch('/donation-number', protect, authorize(USER_ROLES.ADMIN), updateDonationNumber)
router.patch(
  '/notification-settings',
  protect,
  authorize(USER_ROLES.ADMIN),
  updateNotificationSettings,
)

module.exports = router
