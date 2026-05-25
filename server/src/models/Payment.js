const mongoose = require('mongoose')
const { PAYMENT_STATUSES, PAYMENT_TYPES } = require('../constants/paymentConstants')

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(PAYMENT_TYPES),
      default: PAYMENT_TYPES.MONTHLY_FEE,
      index: true,
    },
    month: {
      type: String,
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must use YYYY-MM format.'],
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative.'],
    },
    method: {
      type: String,
      required: true,
      trim: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    senderPhone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [300, 'Payment note cannot exceed 300 characters.'],
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

paymentSchema.index({ user: 1, type: 1, month: 1 }, { unique: true })

module.exports = mongoose.model('Payment', paymentSchema)
