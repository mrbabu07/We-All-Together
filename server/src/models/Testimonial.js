const mongoose = require('mongoose')

const testimonialSchema = new mongoose.Schema(
  {
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    joinYear: {
      type: String,
      trim: true,
      default: '',
      maxlength: [20, 'Join year cannot exceed 20 characters.'],
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
    photo: {
      type: String,
      trim: true,
      default: '',
    },
    text: {
      type: String,
      required: [true, 'Testimonial text is required.'],
      trim: true,
      maxlength: [700, 'Testimonial cannot exceed 700 characters.'],
    },
  },
  {
    timestamps: true,
  },
)

testimonialSchema.index({ active: 1, order: 1 })

module.exports = mongoose.model('Testimonial', testimonialSchema)
