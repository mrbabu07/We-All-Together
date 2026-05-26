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
    forMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
      index: true,
    },
    forYear: {
      type: Number,
      min: 2000,
      max: 3000,
      default: null,
      index: true,
    },
    coveredMonths: [
      {
        month: {
          type: Number,
          min: 1,
          max: 12,
          required: true,
        },
        year: {
          type: Number,
          min: 2000,
          max: 3000,
          required: true,
        },
      },
    ],
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative.'],
    },
    amountPaisa: {
      type: Number,
      min: [0, 'Payment amount cannot be negative.'],
      default: 0,
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
    proofImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    lateFeeAmount: {
      type: Number,
      min: [0, 'Late fee cannot be negative.'],
      default: 0,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateFeeApplied: {
      type: Number,
      min: [0, 'Late fee cannot be negative.'],
      default: 0,
    },
    lateFeeAppliedPaisa: {
      type: Number,
      min: [0, 'Late fee cannot be negative.'],
      default: 0,
    },
    waived: {
      type: Boolean,
      default: false,
    },
    waivedReason: {
      type: String,
      trim: true,
      default: '',
    },
    enteredByAdmin: {
      type: Boolean,
      default: false,
    },
    receiptNumber: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    receiptGeneratedAt: {
      type: Date,
      default: null,
    },
    receiptPdfPath: {
      type: String,
      trim: true,
      default: '',
    },
    verificationUrl: {
      type: String,
      trim: true,
      default: '',
    },
    qrCodeDataUrl: {
      type: String,
      trim: true,
      default: '',
    },
    qrGeneratedAt: {
      type: Date,
      default: null,
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
paymentSchema.index({ user: 1, forMonth: 1, forYear: 1 })
paymentSchema.index({ 'coveredMonths.year': 1, 'coveredMonths.month': 1 })

paymentSchema.pre('validate', function syncFeeMonthFields() {
  if (this.month && (!this.forMonth || !this.forYear)) {
    const [year, month] = this.month.split('-').map(Number)
    this.forYear = this.forYear || year
    this.forMonth = this.forMonth || month
  }

  if ((!this.coveredMonths || this.coveredMonths.length === 0) && this.forMonth && this.forYear) {
    this.coveredMonths = [{ month: this.forMonth, year: this.forYear }]
  }

  if (!this.amountPaisa && Number.isFinite(Number(this.amount))) {
    this.amountPaisa = Math.round(Number(this.amount) * 100)
  }

  if (!this.lateFeeApplied && this.lateFeeAppliedPaisa) {
    this.lateFeeApplied = Math.round(Number(this.lateFeeAppliedPaisa || 0)) / 100
  }
})

module.exports = mongoose.model('Payment', paymentSchema)
