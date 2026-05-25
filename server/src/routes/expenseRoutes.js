const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} = require('../controllers/expenseController')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const router = express.Router()

router.use(protect, authorize(USER_ROLES.ADMIN))
router.route('/').get(getExpenses).post(createExpense)
router.route('/:id').patch(updateExpense).delete(deleteExpense)

module.exports = router
