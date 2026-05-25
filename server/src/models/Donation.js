const mongoose = require('mongoose')
const { PAYMENT_STATUSES } = require('../constants/paymentConstants')

const donationSchema = new mongoose.Schema(
  {
    donorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, 'Donor name cannot exceed 80 characters.'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters.'],
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Donation amount must be greater than zero.'],
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
    note: {
      type: String,
      trim: true,
      maxlength: [300, 'Donation note cannot exceed 300 characters.'],
      default: '',
    },
    proofImageUrl: {
      type: String,
      trim: true,
      default: '',
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
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING,
      index: true,
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

module.exports = mongoose.model('Donation', donationSchema)
