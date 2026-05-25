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
