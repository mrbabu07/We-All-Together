const mongoose = require('mongoose')

const feeWaiverSchema = new mongoose.Schema(
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
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, 'Waiver reason cannot exceed 300 characters.'],
    },
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    waivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

feeWaiverSchema.index({ memberId: 1, month: 1, year: 1 }, { unique: true })

module.exports = mongoose.model('FeeWaiver', feeWaiverSchema)
