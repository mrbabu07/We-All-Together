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
      maxlength: [2000, 'Notification message cannot exceed 2000 characters.'],
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
    channel: {
      type: String,
      enum: ['in_app', 'sms', 'whatsapp', 'both'],
      default: 'in_app',
      index: true,
    },
    recipientMode: {
      type: String,
      trim: true,
      default: 'specific',
      index: true,
    },
    scheduledFor: {
      type: Date,
      default: null,
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'scheduled', 'failed'],
      default: 'sent',
      index: true,
    },
    deliveryResults: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
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
notificationSchema.index({ deliveryStatus: 1, scheduledFor: 1 })

module.exports = mongoose.model('Notification', notificationSchema)
