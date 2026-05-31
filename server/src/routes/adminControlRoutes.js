const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const adminControlController = require('../controllers/adminControlController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.use(protect)

router.get('/nav-counts', adminControlController.getNavCounts)

router.use(authorize(USER_ROLES.ADMIN))
router.get('/', adminControlController.getControls)
router.patch('/', adminControlController.updateControls)
router.get('/widgets', adminControlController.getDashboardWidgets)
router.get('/search', adminControlController.globalSearch)
router.get('/finance-report.pdf', adminControlController.exportFinancePdf)
router.get('/members-report.pdf', adminControlController.exportMembersPdf)
router.post('/members/bulk-approve', adminControlController.bulkApprovePending)
router.post('/members/bulk-reject', adminControlController.bulkRejectPending)
router.post('/members/import', adminControlController.importMembers)
router.patch('/members/:id/suspension', adminControlController.setMemberSuspension)
router.post('/sessions/:id/revoke', adminControlController.revokeMemberSessions)
router.post('/finance/manual-fee', adminControlController.manualFeeEntry)
router.post('/finance/waive-fee', adminControlController.waiveFee)

module.exports = router
