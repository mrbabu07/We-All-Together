const mongoose = require('mongoose')
const { AUDIENCES } = require('../constants/contentConstants')

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [140, 'Meeting title cannot exceed 140 characters.'],
    },
    agenda: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Meeting agenda cannot exceed 2000 characters.'],
    },
    meetingDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: [160, 'Location cannot exceed 160 characters.'],
    },
    audience: {
      type: String,
      enum: Object.values(AUDIENCES),
      default: AUDIENCES.MEMBERS,
      index: true,
    },
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

module.exports = mongoose.model('Meeting', meetingSchema)
