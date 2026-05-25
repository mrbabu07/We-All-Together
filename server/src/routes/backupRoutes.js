const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const { exportBackup } = require('../controllers/backupController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/', protect, authorize(USER_ROLES.ADMIN), exportBackup)

module.exports = router
