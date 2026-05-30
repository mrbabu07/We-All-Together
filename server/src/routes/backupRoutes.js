const express = require('express')
const { exportBackup } = require('../controllers/backupController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')

const router = express.Router()

router.get('/', protect, requirePermission('settings.backup'), exportBackup)

module.exports = router
