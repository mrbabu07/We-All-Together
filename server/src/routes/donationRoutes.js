const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  createManualDonation,
  getDonations,
  getMyDonations,
  getVerifiedDonations,
  rejectDonation,
  submitMemberDonation,
  submitDonation,
  verifyDonation,
} = require('../controllers/donationController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.post('/', submitDonation)
router.get('/verified', getVerifiedDonations)
router.get(
  '/my',
  protect,
  authorize(USER_ROLES.MEMBER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN),
  getMyDonations,
)
router.post(
  '/my',
  protect,
  authorize(USER_ROLES.MEMBER, USER_ROLES.MODERATOR, USER_ROLES.ADMIN),
  submitMemberDonation,
)
router.get('/', protect, authorize(USER_ROLES.ADMIN), getDonations)
router.post('/manual', protect, authorize(USER_ROLES.ADMIN), createManualDonation)
router.patch('/:id/verify', protect, authorize(USER_ROLES.ADMIN), verifyDonation)
router.patch('/:id/reject', protect, authorize(USER_ROLES.ADMIN), rejectDonation)

module.exports = router
