const Expense = require('../models/Expense')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { validateExpense } = require('../validators/financeValidators')

const createExpense = asyncHandler(async (req, res) => {
  const payload = validateExpense(req.body)
  const expense = await Expense.create({
    ...payload,
    createdBy: req.user._id,
  })
  await recordAuditLog({
    action: 'expense.create',
    actor: req.user,
    entityId: expense._id,
    entityType: 'Expense',
    metadata: {
      amount: expense.amount,
      category: expense.category,
      title: expense.title,
    },
  })

  res.status(201).json({
    success: true,
    message: 'Expense added successfully.',
    data: {
      expense,
    },
  })
})

const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find()
    .populate('createdBy', 'name phone')
    .sort({ date: -1, createdAt: -1 })

  res.status(200).json({
    success: true,
    message: 'Expenses loaded successfully.',
    data: {
      expenses,
    },
  })
})

const updateExpense = asyncHandler(async (req, res) => {
  const payload = validateExpense(req.body)
  const expense = await Expense.findById(req.params.id)

  if (!expense) {
    throw new AppError('Expense not found.', 404)
  }

  Object.assign(expense, payload)
  await expense.save()
  await recordAuditLog({
    action: 'expense.update',
    actor: req.user,
    entityId: expense._id,
    entityType: 'Expense',
    metadata: {
      amount: expense.amount,
      category: expense.category,
      title: expense.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Expense updated successfully.',
    data: {
      expense,
    },
  })
})

const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id)

  if (!expense) {
    throw new AppError('Expense not found.', 404)
  }

  await expense.deleteOne()
  await recordAuditLog({
    action: 'expense.delete',
    actor: req.user,
    entityId: req.params.id,
    entityType: 'Expense',
    metadata: {
      amount: expense.amount,
      category: expense.category,
      title: expense.title,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully.',
    data: {
      id: req.params.id,
    },
  })
})

module.exports = {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
}
