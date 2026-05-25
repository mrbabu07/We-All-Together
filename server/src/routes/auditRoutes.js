const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const { getAuditLogs } = require('../controllers/auditController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/', protect, authorize(USER_ROLES.ADMIN), getAuditLogs)

module.exports = router
