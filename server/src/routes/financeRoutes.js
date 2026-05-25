const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const { getFinanceAnalytics } = require('../controllers/financeController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/analytics', protect, authorize(USER_ROLES.ADMIN), getFinanceAnalytics)

module.exports = router
