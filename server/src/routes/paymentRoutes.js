const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  getAllPayments,
  getMonthlyPaymentStatus,
  getMyPayments,
  getPaymentById,
  rejectPayment,
  submitMonthlyPayment,
  verifyPayment,
} = require('../controllers/paymentController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.post(
  '/monthly',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  submitMonthlyPayment,
)
router.get(
  '/my',
  protect,
  authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
  getMyPayments,
)
router.get('/', protect, authorize(USER_ROLES.ADMIN), getAllPayments)
router.get('/monthly-status', protect, authorize(USER_ROLES.ADMIN), getMonthlyPaymentStatus)
router.get('/:id', protect, authorize(USER_ROLES.ADMIN), getPaymentById)
router.patch('/:id/verify', protect, authorize(USER_ROLES.ADMIN), verifyPayment)
router.patch('/:id/reject', protect, authorize(USER_ROLES.ADMIN), rejectPayment)

module.exports = router
