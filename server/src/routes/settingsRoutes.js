const express = require('express')
const {
  getPublicSettings,
  updateDonationNumber,
  updateMonthlyFee,
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

module.exports = router
