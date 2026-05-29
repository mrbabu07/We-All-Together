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
    caption: {
      type: String,
      trim: true,
      maxlength: [300, 'Caption cannot exceed 300 characters.'],
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
    album: {
      type: String,
      trim: true,
      default: 'General',
      index: true,
    },
    albumDescription: {
      type: String,
      trim: true,
      default: '',
    },
    albumCoverUrl: {
      type: String,
      trim: true,
      default: '',
    },
    albumVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
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
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      default: null,
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
