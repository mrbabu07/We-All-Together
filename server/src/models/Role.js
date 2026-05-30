const mongoose = require('mongoose')
const { ALL_PERMISSIONS } = require('../constants/permissionConstants')

const roleSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      trim: true,
      default: '#00ADB5',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Role description cannot exceed 500 characters.'],
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: [true, 'Role name is required.'],
      trim: true,
      unique: true,
      maxlength: [80, 'Role name cannot exceed 80 characters.'],
    },
    nameEnglish: {
      type: String,
      trim: true,
      maxlength: [80, 'English role name cannot exceed 80 characters.'],
      default: '',
    },
    permissions: [
      {
        type: String,
        validate: {
          message: 'Role includes an unknown permission.',
          validator(value) {
            return value === '*' || Object.prototype.hasOwnProperty.call(ALL_PERMISSIONS, value)
          },
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

roleSchema.virtual('memberCount', {
  count: true,
  foreignField: 'role',
  justOne: false,
  localField: 'name',
  ref: 'User',
})

module.exports = mongoose.model('Role', roleSchema)
