const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  downloadReceiptPdf,
  getDonationReceipt,
  getPaymentReceipt,
  getRegistrationReceipt,
} = require('../controllers/receiptController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get(
  '/payments/:id',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER),
  getPaymentReceipt,
)
router.get(
  '/registrations/:id',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER),
  getRegistrationReceipt,
)
router.get('/donations/:id', protect, authorize(USER_ROLES.ADMIN), getDonationReceipt)
router.get('/:id', downloadReceiptPdf)

module.exports = router
