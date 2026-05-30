const express = require('express')
const { getFinanceAnalytics } = require('../controllers/financeController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')

const router = express.Router()

router.get('/analytics', protect, requirePermission('finance.view'), getFinanceAnalytics)

module.exports = router
