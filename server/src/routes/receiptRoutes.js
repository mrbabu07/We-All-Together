const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  downloadRegistrationReceiptPdf,
  downloadReceiptPdf,
  getDonationReceipt,
  getPaymentReceipt,
  getRegistrationReceipt,
} = require('../controllers/receiptController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get(
  '/payments/:id/pdf',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  downloadReceiptPdf,
)
router.get('/donations/:id/pdf', protect, requirePermission('finance.view'), downloadReceiptPdf)
router.get(
  '/registrations/:id/pdf',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  downloadRegistrationReceiptPdf,
)
router.get(
  '/payments/:id',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  getPaymentReceipt,
)
router.get(
  '/registrations/:id',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  getRegistrationReceipt,
)
router.get('/donations/:id', protect, requirePermission('finance.view'), getDonationReceipt)
router.get('/:id', downloadReceiptPdf)

module.exports = router
