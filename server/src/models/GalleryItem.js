const mongoose = require('mongoose')
const { AUDIENCES } = require('../constants/contentConstants')

const galleryItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [140, 'Gallery title cannot exceed 140 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1200, 'Gallery description cannot exceed 1200 characters.'],
      default: '',
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      enum: Object.values(AUDIENCES),
      default: AUDIENCES.PUBLIC,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

galleryItemSchema.index({ createdAt: -1 })

module.exports = mongoose.model('GalleryItem', galleryItemSchema)
