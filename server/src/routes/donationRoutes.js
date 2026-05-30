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
const { requirePermission } = require('../middlewares/permissionMiddleware')
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
router.get('/', protect, requirePermission('finance.view'), getDonations)
router.post('/manual', protect, requirePermission('finance.add_donation'), createManualDonation)
router.patch('/:id/verify', protect, requirePermission('finance.add_donation'), verifyDonation)
router.patch('/:id/reject', protect, requirePermission('finance.add_donation'), rejectDonation)

module.exports = router
