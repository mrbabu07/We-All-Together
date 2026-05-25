const mongoose = require('mongoose')
const { AUDIENCES, ITEM_STATUSES } = require('../constants/contentConstants')

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [140, 'Tour title cannot exceed 140 characters.'],
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      maxlength: [160, 'Destination cannot exceed 160 characters.'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative.'],
      default: 0,
    },
    details: {
      type: String,
      trim: true,
      maxlength: [2400, 'Tour details cannot exceed 2400 characters.'],
      default: '',
    },
    audience: {
      type: String,
      enum: Object.values(AUDIENCES),
      default: AUDIENCES.MEMBERS,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ITEM_STATUSES),
      default: ITEM_STATUSES.PLANNED,
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    participants: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['interested', 'confirmed', 'paid', 'cancelled'],
          default: 'interested',
        },
        amountDue: {
          type: Number,
          min: [0, 'Amount due cannot be negative.'],
          default: 0,
        },
        paidAmount: {
          type: Number,
          min: [0, 'Paid amount cannot be negative.'],
          default: 0,
        },
        note: {
          type: String,
          trim: true,
          maxlength: [300, 'Participant note cannot exceed 300 characters.'],
          default: '',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    rsvp: [
      {
        memberId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['going', 'not_going', 'maybe'],
          default: 'going',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

module.exports = mongoose.model('Tour', tourSchema)
