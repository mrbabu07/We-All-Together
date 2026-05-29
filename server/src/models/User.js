const mongoose = require('mongoose')
const { PAYMENT_STATUSES } = require('../constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const { comparePassword, hashPassword } = require('../utils/passwordUtils')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [80, 'Name cannot exceed 80 characters.'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required.'],
      unique: true,
      trim: true,
      minlength: [7, 'Phone must be at least 7 characters.'],
      maxlength: [20, 'Phone cannot exceed 20 characters.'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      maxlength: [120, 'Email cannot exceed 120 characters.'],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email must be valid.'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [240, 'Address cannot exceed 240 characters.'],
      default: '',
    },
    profilePhotoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    nidImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    birthCertificateUrl: {
      type: String,
      trim: true,
      default: '',
    },
    passportImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        default: '',
      },
      phone: {
        type: String,
        trim: true,
        default: '',
      },
      relation: {
        type: String,
        trim: true,
        default: '',
      },
    },
    notificationPreferences: {
      notices: {
        type: Boolean,
        default: true,
      },
      meetings: {
        type: Boolean,
        default: true,
      },
      fees: {
        type: Boolean,
        default: true,
      },
      tours: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: true,
      },
      whatsapp: {
        type: Boolean,
        default: false,
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters.'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.MEMBER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUSES),
      default: USER_STATUSES.PENDING,
      index: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    suspensionReason: {
      type: String,
      trim: true,
      default: '',
    },
    softDeletedAt: {
      type: Date,
      default: null,
    },
    deleteRequestedAt: {
      type: Date,
      default: null,
    },
    deleteRequestReason: {
      type: String,
      trim: true,
      default: '',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      trim: true,
      default: '',
    },
    sessionVersion: {
      type: Number,
      min: 0,
      default: 0,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    registrationPayment: {
      amount: {
        type: Number,
        min: [0, 'Payment amount cannot be negative.'],
        default: 0,
      },
      method: {
        type: String,
        trim: true,
        default: '',
      },
      transactionId: {
        type: String,
        trim: true,
        default: '',
      },
      senderPhone: {
        type: String,
        trim: true,
        default: '',
      },
      note: {
        type: String,
        trim: true,
        maxlength: [300, 'Payment note cannot exceed 300 characters.'],
        default: '',
      },
      proofImageUrl: {
        type: String,
        trim: true,
        default: '',
      },
      status: {
        type: String,
        enum: Object.values(PAYMENT_STATUSES),
        default: PAYMENT_STATUSES.PENDING,
      },
      paidAt: {
        type: Date,
        default: null,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
)

userSchema.pre('save', async function hashPasswordBeforeSave() {
  if (!this.isModified('password')) {
    return
  }

  this.password = await hashPassword(this.password)
})

userSchema.methods.comparePassword = function compareUserPassword(password) {
  return comparePassword(password, this.password)
}

userSchema.methods.toJSON = function toSafeJSON() {
  const user = this.toObject()
  delete user.password
  return user
}

module.exports = mongoose.model('User', userSchema)
