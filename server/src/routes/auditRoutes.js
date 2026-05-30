const express = require('express')
const { getAuditLogs } = require('../controllers/auditController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')

const router = express.Router()

router.get('/', protect, requirePermission('audit.view'), getAuditLogs)

module.exports = router
