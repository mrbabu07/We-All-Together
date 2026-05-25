const mongoose = require('mongoose')

const pollSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
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
  return Array.isArray(options) && options.length >= 2
}, 'A poll must have at least two options.')

module.exports = mongoose.model('Poll', pollSchema)
