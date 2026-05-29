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
    tourFee: {
      type: Number,
      min: [0, 'Tour fee cannot be negative.'],
      default: 0,
    },
    seatCapacity: {
      type: Number,
      min: [0, 'Seat capacity cannot be negative.'],
      default: 0,
    },
    registrationOpen: {
      type: Boolean,
      default: false,
    },
    expenses: [
      {
        title: {
          type: String,
          trim: true,
          default: '',
        },
        category: {
          type: String,
          trim: true,
          default: 'Other',
        },
        amount: {
          type: Number,
          min: [0, 'Tour expense amount cannot be negative.'],
          default: 0,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        receiptImageUrl: {
          type: String,
          trim: true,
          default: '',
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
      },
    ],
    waitlist: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    feedback: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
          default: '',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    albumCreated: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    galleryAlbum: {
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
