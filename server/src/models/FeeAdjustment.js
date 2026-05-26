const mongoose = require('mongoose')

const feeAdjustmentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 3000,
    },
    amountPaisa: {
      type: Number,
      required: true,
      min: [0, 'Adjusted fee amount cannot be negative.'],
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, 'Adjustment reason cannot exceed 300 characters.'],
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adjustedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

feeAdjustmentSchema.index({ memberId: 1, month: 1, year: 1 }, { unique: true })

module.exports = mongoose.model('FeeAdjustment', feeAdjustmentSchema)
