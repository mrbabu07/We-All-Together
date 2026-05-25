const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  getDonations,
  getVerifiedDonations,
  rejectDonation,
  submitDonation,
  verifyDonation,
} = require('../controllers/donationController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.post('/', submitDonation)
router.get('/verified', getVerifiedDonations)
router.get('/', protect, authorize(USER_ROLES.ADMIN), getDonations)
router.patch('/:id/verify', protect, authorize(USER_ROLES.ADMIN), verifyDonation)
router.patch('/:id/reject', protect, authorize(USER_ROLES.ADMIN), rejectDonation)

module.exports = router
