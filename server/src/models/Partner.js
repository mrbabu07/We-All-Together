const mongoose = require('mongoose')

const partnerSchema = new mongoose.Schema(
  {
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    logo: {
      type: String,
      required: [true, 'Logo is required.'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters.'],
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

partnerSchema.index({ active: 1, order: 1 })

module.exports = mongoose.model('Partner', partnerSchema)
