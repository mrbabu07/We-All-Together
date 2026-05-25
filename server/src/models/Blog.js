const mongoose = require('mongoose')
const { AUDIENCES } = require('../constants/contentConstants')

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [160, 'Blog title cannot exceed 160 characters.'],
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: [5000, 'Blog body cannot exceed 5000 characters.'],
    },
    audience: {
      type: String,
      enum: Object.values(AUDIENCES),
      default: AUDIENCES.PUBLIC,
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
    moderationNote: {
      type: String,
      trim: true,
      default: '',
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
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
          required: true,
        },
        body: {
          type: String,
          required: true,
          trim: true,
          maxlength: [1000, 'Comment cannot exceed 1000 characters.'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

blogSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Blog', blogSchema)
