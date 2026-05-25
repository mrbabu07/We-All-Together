const mongoose = require('mongoose')

const organizationSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'default',
    },
    registrationFee: {
      type: Number,
      min: [0, 'Registration fee cannot be negative.'],
      default: 0,
    },
    monthlyFee: {
      type: Number,
      min: [0, 'Monthly fee cannot be negative.'],
      default: 0,
    },
    donationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    donationProvider: {
      type: String,
      trim: true,
      default: '',
    },
    notificationSettings: {
      smsNoticeEnabled: {
        type: Boolean,
        default: false,
      },
      smsMeetingEnabled: {
        type: Boolean,
        default: false,
      },
      smsFeeReminderEnabled: {
        type: Boolean,
        default: false,
      },
      whatsappNoticeEnabled: {
        type: Boolean,
        default: false,
      },
      whatsappMeetingEnabled: {
        type: Boolean,
        default: false,
      },
      whatsappFeeReminderEnabled: {
        type: Boolean,
        default: false,
      },
      lastFeeReminderMonth: {
        type: String,
        trim: true,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('OrganizationSetting', organizationSettingSchema)
