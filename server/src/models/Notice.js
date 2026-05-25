const mongoose = require('mongoose')
const { AUDIENCES } = require('../constants/contentConstants')

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [140, 'Notice title cannot exceed 140 characters.'],
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Notice body cannot exceed 2000 characters.'],
    },
    audience: {
      type: String,
      enum: Object.values(AUDIENCES),
      default: AUDIENCES.PUBLIC,
      index: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      index: true,
    },
    richBody: {
      type: String,
      trim: true,
      default: '',
    },
    scheduledFor: {
      type: Date,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    readReceipts: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        type: {
          type: String,
          enum: ['like', 'love'],
          default: 'like',
        },
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        body: {
          type: String,
          trim: true,
          maxlength: [500, 'Comment cannot exceed 500 characters.'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    imageUrl: {
      type: String,
      trim: true,
      default: '',
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

module.exports = mongoose.model('Notice', noticeSchema)
