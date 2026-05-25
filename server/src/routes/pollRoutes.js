const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const pollController = require('../controllers/pollController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.get('/', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), pollController.getPolls)
router.post('/', protect, authorize(USER_ROLES.ADMIN), pollController.createPoll)
router.get('/:id', protect, authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER), pollController.getPoll)
router.post('/:id/vote', protect, authorize(USER_ROLES.MEMBER), pollController.votePoll)

module.exports = router
