const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Expense title cannot exceed 120 characters.'],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Expense amount cannot be negative.'],
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, 'Expense category cannot exceed 80 characters.'],
    },
    date: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [300, 'Expense note cannot exceed 300 characters.'],
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Expense', expenseSchema)
