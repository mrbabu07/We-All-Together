const express = require('express')
const authRoutes = require('./authRoutes')
const healthRoutes = require('./healthRoutes')
const registrationRoutes = require('./registrationRoutes')
const settingsRoutes = require('./settingsRoutes')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/health', healthRoutes)
router.use('/registrations', registrationRoutes)
router.use('/settings', settingsRoutes)

module.exports = router
