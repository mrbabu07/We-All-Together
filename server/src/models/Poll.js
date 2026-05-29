const mongoose = require('mongoose')

const pollSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      default: null,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: [240, 'Poll question cannot exceed 240 characters.'],
    },
    options: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: [120, 'Poll option cannot exceed 120 characters.'],
        },
        votes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    deadline: {
      type: Date,
      required: true,
      index: true,
    },
    isClosed: {
      type: Boolean,
      default: false,
      index: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

pollSchema.path('options').validate(function validatePollOptions(options) {
  return Array.isArray(options) && options.length >= 2 && options.length <= 6
}, 'A poll must have between two and six options.')

module.exports = mongoose.model('Poll', pollSchema)
