const mongoose = require('mongoose')
const { AUDIENCES } = require('../constants/contentConstants')

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [140, 'Meeting title cannot exceed 140 characters.'],
    },
    agenda: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Meeting agenda cannot exceed 2000 characters.'],
    },
    meetingDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: [160, 'Location cannot exceed 160 characters.'],
    },
    audience: {
      type: String,
      enum: Object.values(AUDIENCES),
      default: AUDIENCES.MEMBERS,
      index: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    minutes: {
      type: String,
      trim: true,
      maxlength: [3000, 'Meeting minutes cannot exceed 3000 characters.'],
      default: '',
    },
    minutesRichText: {
      type: String,
      trim: true,
      default: '',
    },
    minutesStatus: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    minutesPublishedAt: {
      type: Date,
      default: null,
    },
    agendaItems: [
      {
        title: {
          type: String,
          trim: true,
          default: '',
        },
        details: {
          type: String,
          trim: true,
          default: '',
        },
        durationMinutes: {
          type: Number,
          min: [0, 'Agenda duration cannot be negative.'],
          default: 0,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    actionItems: [
      {
        title: {
          type: String,
          trim: true,
          default: '',
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        dueDate: {
          type: Date,
          default: null,
        },
      },
    ],
    attendanceMode: {
      active: {
        type: Boolean,
        default: false,
      },
      method: {
        type: String,
        enum: ['manual', 'otp', 'qr'],
        default: 'manual',
      },
      otp: {
        type: String,
        trim: true,
        default: '',
      },
      qrCodeDataUrl: {
        type: String,
        trim: true,
        default: '',
      },
      openedAt: {
        type: Date,
        default: null,
      },
      closedAt: {
        type: Date,
        default: null,
      },
    },
    attendance: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent', 'excused'],
          default: 'present',
        },
        note: {
          type: String,
          trim: true,
          maxlength: [300, 'Attendance note cannot exceed 300 characters.'],
          default: '',
        },
        recordedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    rsvp: [
      {
        memberId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['going', 'not_going', 'maybe'],
          default: 'going',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recapSentAt: {
      type: Date,
      default: null,
    },
    recapMessage: {
      type: String,
      trim: true,
      default: '',
    },
    recapSentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('Meeting', meetingSchema)
