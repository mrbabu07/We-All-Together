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
const { requirePermission } = require('../middlewares/permissionMiddleware')
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
router.get('/overdue-members', protect, requirePermission('finance.view'), getOverdueMembers)
router.post('/adjust', protect, requirePermission('finance.waive_fee'), adjustFeeAmount)
router.delete('/adjust/:adjustmentId', protect, requirePermission('finance.waive_fee'), removeFeeAdjustment)
router.post('/waive', protect, requirePermission('finance.waive_fee'), waiveFee)
router.delete('/waive/:waiverId', protect, requirePermission('finance.waive_fee'), removeWaiver)
router.post(
  '/member/:memberId/reminder',
  protect,
  requirePermission('notification.send'),
  sendMemberFeeReminder,
)
router.get('/member/:memberId/history', protect, requirePermission('finance.view'), getMemberHistory)

module.exports = router
