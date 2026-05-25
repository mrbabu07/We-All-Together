const mongoose = require('mongoose')
const { AUDIENCES } = require('../constants/contentConstants')

const ruleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [140, 'Rule title cannot exceed 140 characters.'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2400, 'Rule description cannot exceed 2400 characters.'],
    },
    audience: {
      type: String,
      enum: Object.values(AUDIENCES),
      default: AUDIENCES.MEMBERS,
      index: true,
    },
    order: {
      type: Number,
      min: [0, 'Rule order cannot be negative.'],
      default: 0,
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

module.exports = mongoose.model('Rule', ruleSchema)
