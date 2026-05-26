const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  adjustFeeAmount,
  getMemberHistory,
  getMyFeeHistory,
  getMyFeeStatus,
  getOverdueMembers,
  payFees,
  removeFeeAdjustment,
  removeWaiver,
  sendMemberFeeReminder,
  waiveFee,
} = require('../controllers/feeController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get(
  '/my-status',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  getMyFeeStatus,
)
router.get(
  '/my-history',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  getMyFeeHistory,
)
router.post(
  '/pay',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  payFees,
)
router.get('/overdue-members', protect, authorize(USER_ROLES.ADMIN), getOverdueMembers)
router.post('/adjust', protect, authorize(USER_ROLES.ADMIN), adjustFeeAmount)
router.delete('/adjust/:adjustmentId', protect, authorize(USER_ROLES.ADMIN), removeFeeAdjustment)
router.post('/waive', protect, authorize(USER_ROLES.ADMIN), waiveFee)
router.delete('/waive/:waiverId', protect, authorize(USER_ROLES.ADMIN), removeWaiver)
router.post(
  '/member/:memberId/reminder',
  protect,
  authorize(USER_ROLES.ADMIN),
  sendMemberFeeReminder,
)
router.get('/member/:memberId/history', protect, authorize(USER_ROLES.ADMIN), getMemberHistory)

module.exports = router
