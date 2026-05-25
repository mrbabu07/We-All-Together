const express = require('express')
const authRoutes = require('./authRoutes')
const donationRoutes = require('./donationRoutes')
const expenseRoutes = require('./expenseRoutes')
const healthRoutes = require('./healthRoutes')
const paymentRoutes = require('./paymentRoutes')
const registrationRoutes = require('./registrationRoutes')
const settingsRoutes = require('./settingsRoutes')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/donations', donationRoutes)
router.use('/expenses', expenseRoutes)
router.use('/health', healthRoutes)
router.use('/payments', paymentRoutes)
router.use('/registrations', registrationRoutes)
router.use('/settings', settingsRoutes)

module.exports = router
