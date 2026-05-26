const mongoose = require('mongoose')

const committeeMemberSchema = new mongoose.Schema(
  {
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    photo: {
      type: String,
      trim: true,
      default: '',
    },
    position: {
      type: String,
      required: [true, 'Position is required.'],
      trim: true,
      maxlength: [100, 'Position cannot exceed 100 characters.'],
    },
    showPhone: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

committeeMemberSchema.index({ active: 1, order: 1 })

module.exports = mongoose.model('CommitteeMember', committeeMemberSchema)
