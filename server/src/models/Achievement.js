const mongoose = require('mongoose')

const achievementSchema = new mongoose.Schema(
  {
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
      maxlength: [600, 'Description cannot exceed 600 characters.'],
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    photo: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters.'],
    },
    year: {
      type: String,
      required: [true, 'Year is required.'],
      trim: true,
      maxlength: [20, 'Year cannot exceed 20 characters.'],
    },
  },
  {
    timestamps: true,
  },
)

achievementSchema.index({ active: 1, order: 1 })

module.exports = mongoose.model('Achievement', achievementSchema)
