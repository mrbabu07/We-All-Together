const express = require('express')
const {
  getPublicSettings,
  updateDonationNumber,
  updateMonthlyFee,
  updateNotificationSettings,
  updateRegistrationFee,
} = require('../controllers/settingsController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')

const router = express.Router()

router.get('/public', getPublicSettings)
router.patch('/registration-fee', protect, requirePermission('settings.org'), updateRegistrationFee)
router.patch('/monthly-fee', protect, requirePermission('finance.waive_fee'), updateMonthlyFee)
router.patch('/donation-number', protect, requirePermission('settings.org'), updateDonationNumber)
router.patch(
  '/notification-settings',
  protect,
  requirePermission('settings.org'),
  updateNotificationSettings,
)

module.exports = router
