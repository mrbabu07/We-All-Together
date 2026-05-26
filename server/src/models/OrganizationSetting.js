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
    monthlyFeeAmount: {
      type: Number,
      min: [0, 'Monthly fee amount cannot be negative.'],
      default: 50000,
    },
    feeLateFeeAmount: {
      type: Number,
      min: [0, 'Late fee amount cannot be negative.'],
      default: 0,
    },
    feeDueDay: {
      type: Number,
      min: 1,
      max: 28,
      default: 1,
    },
    feeOverdueAlertEnabled: {
      type: Boolean,
      default: true,
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
    siteSettings: {
      orgName: {
        type: String,
        trim: true,
        default: 'Dargah Para OIkko Porishod',
      },
      logoUrl: {
        type: String,
        trim: true,
        default: '',
      },
      tagline: {
        type: String,
        trim: true,
        default: 'ঐক্য, সেবা ও স্বচ্ছতা',
      },
      address: {
        type: String,
        trim: true,
        default: 'Dargah Para, Bangladesh',
      },
      contactNumber: {
        type: String,
        trim: true,
        default: '',
      },
      email: {
        type: String,
        trim: true,
        default: '',
      },
      welcomeMessage: {
        type: String,
        trim: true,
        default: 'স্বাগতম। আপনার সদস্য ড্যাশবোর্ড থেকে সব আপডেট দেখুন।',
      },
      facebookUrl: {
        type: String,
        trim: true,
        default: '',
      },
      youtubeUrl: {
        type: String,
        trim: true,
        default: '',
      },
      whatsappGroupUrl: {
        type: String,
        trim: true,
        default: '',
      },
      registrationEnabled: {
        type: Boolean,
        default: true,
      },
      publicDonationsEnabled: {
        type: Boolean,
        default: true,
      },
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
    },
    financeControls: {
      monthlyFeeDueDate: {
        type: Number,
        enum: [1, 5, 10],
        default: 10,
      },
      lateFeeAmount: {
        type: Number,
        min: [0, 'Late fee cannot be negative.'],
        default: 0,
      },
      lateFeeEnabled: {
        type: Boolean,
        default: false,
      },
      fiscalYearStartMonth: {
        type: Number,
        min: 1,
        max: 12,
        default: 1,
      },
    },
    contentControls: {
      noticeCategories: [
        {
          type: String,
          trim: true,
        },
      ],
      meetingTemplates: [
        {
          title: {
            type: String,
            trim: true,
            default: '',
          },
          agenda: {
            type: String,
            trim: true,
            default: '',
          },
        },
      ],
    },
    appearance: {
      primaryColor: {
        type: String,
        trim: true,
        default: '#4F46E5',
      },
      colorMode: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light',
      },
      fontSize: {
        type: String,
        enum: ['normal', 'large', 'extra-large'],
        default: 'normal',
      },
      heroImageUrl: {
        type: String,
        trim: true,
        default: '',
      },
      customCss: {
        type: String,
        trim: true,
        default: '',
      },
    },
    homepageControls: {
      achievementsEnabled: {
        type: Boolean,
        default: true,
      },
      certificateEnabled: {
        type: Boolean,
        default: true,
      },
      certificateImageUrl: {
        type: String,
        trim: true,
        default: '',
      },
      committeeEnabled: {
        type: Boolean,
        default: true,
      },
      cookieConsentEnabled: {
        type: Boolean,
        default: true,
      },
      countdownEnabled: {
        type: Boolean,
        default: true,
      },
      darkModeToggleEnabled: {
        type: Boolean,
        default: true,
      },
      facebookEmbedEnabled: {
        type: Boolean,
        default: false,
      },
      facebookPageUrl: {
        type: String,
        trim: true,
        default: '',
      },
      fontSizeControlsEnabled: {
        type: Boolean,
        default: true,
      },
      galleryDownloadEnabled: {
        type: Boolean,
        default: true,
      },
      googleMapsEmbedUrl: {
        type: String,
        trim: true,
        default: '',
      },
      googleMapsEnabled: {
        type: Boolean,
        default: true,
      },
      newsTickerEnabled: {
        type: Boolean,
        default: true,
      },
      partnersEnabled: {
        type: Boolean,
        default: true,
      },
      testimonialsEnabled: {
        type: Boolean,
        default: true,
      },
      trustBadgeLabels: [
        {
          type: String,
          trim: true,
        },
      ],
      trustBadgesEnabled: {
        type: Boolean,
        default: true,
      },
      typewriterPhrases: [
        {
          type: String,
          trim: true,
        },
      ],
      whatsappButtonEnabled: {
        type: Boolean,
        default: true,
      },
      whatsappNumber: {
        type: String,
        trim: true,
        default: '',
      },
      youtubeDescription: {
        type: String,
        trim: true,
        default: '',
      },
      youtubeEnabled: {
        type: Boolean,
        default: false,
      },
      youtubeTitle: {
        type: String,
        trim: true,
        default: '',
      },
      youtubeUrl: {
        type: String,
        trim: true,
        default: '',
      },
    },
    securityControls: {
      autoBackupSchedule: {
        type: String,
        enum: ['off', 'daily', 'weekly'],
        default: 'off',
      },
      twoFactorRequiredForAdmins: {
        type: Boolean,
        default: false,
      },
      adminIpWhitelist: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    notificationSettings: {
      smsGloballyEnabled: {
        type: Boolean,
        default: false,
      },
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
