const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Notification title cannot exceed 120 characters.'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Notification message cannot exceed 500 characters.'],
    },
    type: {
      type: String,
      trim: true,
      default: 'general',
      index: true,
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

notificationSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
