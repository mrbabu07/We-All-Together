const express = require('express')
const {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} = require('../controllers/expenseController')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')

const router = express.Router()

router.use(protect)
router
  .route('/')
  .get(requirePermission('finance.view'), getExpenses)
  .post(requirePermission('finance.add_expense'), createExpense)
router
  .route('/:id')
  .patch(requirePermission('finance.add_expense'), updateExpense)
  .delete(requirePermission('finance.add_expense'), deleteExpense)

module.exports = router
