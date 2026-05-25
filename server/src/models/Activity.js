const mongoose = require('mongoose')
const { AUDIENCES, ITEM_STATUSES } = require('../constants/contentConstants')

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [140, 'Activity title cannot exceed 140 characters.'],
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, 'Activity category cannot exceed 80 characters.'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2400, 'Activity description cannot exceed 2400 characters.'],
    },
    activityDate: {
      type: Date,
      required: true,
    },
    participantsCount: {
      type: Number,
      min: [0, 'Participants count cannot be negative.'],
      default: 0,
    },
    audience: {
      type: String,
      enum: Object.values(AUDIENCES),
      default: AUDIENCES.PUBLIC,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ITEM_STATUSES),
      default: ITEM_STATUSES.PLANNED,
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

module.exports = mongoose.model('Activity', activitySchema)
