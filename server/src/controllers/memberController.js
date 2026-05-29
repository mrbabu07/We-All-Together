const mongoose = require('mongoose')
const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const Blog = require('../models/Blog')
const Donation = require('../models/Donation')
const Meeting = require('../models/Meeting')
const Payment = require('../models/Payment')
const Tour = require('../models/Tour')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')
const { recordAuditLog } = require('../services/auditService')
const { createNotification } = require('../services/notificationService')
const { validateAdminPasswordReset } = require('../validators/authValidators')
const { isBangladeshiPhone, normalizeBangladeshiPhone } = require('../utils/phoneUtils')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getApprovedMembers = asyncHandler(async (req, res) => {
  const members = await User.find({
    role: USER_ROLES.MEMBER,
    status: USER_STATUSES.APPROVED,
  }).sort({ name: 1 })

  res.status(200).json({
    success: true,
    message: 'Members loaded successfully.',
    data: {
      members,
    },
  })
})

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    message: 'Users loaded successfully.',
    data: {
      users,
    },
  })
})

const verifyMemberPublic = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new AppError('Verified member not found.', 404)
  }

  const user = await User.findOne({
    _id: req.params.id,
    softDeletedAt: null,
    status: USER_STATUSES.APPROVED,
  }).select('approvedAt name phone profilePhotoUrl role status')

  if (!user) {
    throw new AppError('Verified member not found.', 404)
  }

  res.status(200).json({
    success: true,
    message: 'Member verification loaded successfully.',
    data: {
      member: {
        approvedAt: user.approvedAt,
        memberId: user._id,
        name: user.name,
        phoneLast4: user.phone ? user.phone.slice(-4) : '',
        profilePhotoUrl: user.profilePhotoUrl,
        role: user.role,
        status: user.status,
      },
    },
  })
})

const updateMemberProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('Member not found.', 404)
  }

  if (typeof req.body.name === 'string') {
    const name = req.body.name.trim()

    if (!name) {
      throw new AppError('Name is required.', 400)
    }

    user.name = name
  }

  if (typeof req.body.phone === 'string') {
    const phone = normalizeBangladeshiPhone(req.body.phone)

    if (!isBangladeshiPhone(phone)) {
      throw new AppError('Phone must use Bangladeshi format like 017XXXXXXXX.', 400)
    }

    user.phone = phone
  }

  if (typeof req.body.email === 'string') {
    const email = req.body.email.trim().toLowerCase()

    if (email && !EMAIL_PATTERN.test(email)) {
      throw new AppError('Email must be valid.', 400)
    }

    user.email = email || undefined
  }

  ;['address', 'profilePhotoUrl', 'nidImageUrl', 'birthCertificateUrl', 'passportImageUrl'].forEach(
    (field) => {
      if (typeof req.body[field] === 'string') {
        user[field] = req.body[field].trim()
      }
    },
  )

  if (req.body.emergencyContact && typeof req.body.emergencyContact === 'object') {
    const emergencyPhone =
      typeof req.body.emergencyContact.phone === 'string'
        ? normalizeBangladeshiPhone(req.body.emergencyContact.phone)
        : ''

    if (emergencyPhone && !isBangladeshiPhone(emergencyPhone)) {
      throw new AppError('Emergency phone must use Bangladeshi format like 017XXXXXXXX.', 400)
    }

    user.emergencyContact = {
      name:
        typeof req.body.emergencyContact.name === 'string'
          ? req.body.emergencyContact.name.trim()
          : user.emergencyContact?.name || '',
      phone: emergencyPhone,
      relation:
        typeof req.body.emergencyContact.relation === 'string'
          ? req.body.emergencyContact.relation.trim()
          : user.emergencyContact?.relation || '',
    }
  }

  await user.save()
  await recordAuditLog({
    action: 'member.update',
    actor: req.user,
    entityId: user._id,
    entityType: 'User',
    metadata: {
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
  })

  res.status(200).json({
    success: true,
    message: 'Member updated successfully.',
    data: {
      user,
    },
  })
})

const updateUserAccess = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found.', 404)
  }

  if (req.body.role !== undefined) {
    if (!Object.values(USER_ROLES).includes(req.body.role)) {
      throw new AppError('Role is invalid.', 400)
    }

    user.role = req.body.role
  }

  if (req.body.status !== undefined) {
    if (!Object.values(USER_STATUSES).includes(req.body.status)) {
      throw new AppError('Status is invalid.', 400)
    }

    user.status = req.body.status

    if (req.body.status === USER_STATUSES.APPROVED && !user.approvedAt) {
      user.approvedAt = new Date()
      user.approvedBy = req.user._id
    }
  }

  await user.save()
  await createNotification({
    createdBy: req.user,
    link: '/member',
    message: `Your account access is now ${user.status}.`,
    title: 'Account access updated',
    type: 'account',
    user,
  })
  await recordAuditLog({
    action: 'member.access.update',
    actor: req.user,
    entityId: user._id,
    entityType: 'User',
    metadata: {
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
  })

  res.status(200).json({
    success: true,
    message: 'User access updated successfully.',
    data: {
      user,
    },
  })
})

const deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    throw new AppError('You cannot delete your own account.', 400)
  }

  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found.', 404)
  }

  user.softDeletedAt = new Date()
  await user.save()
  await recordAuditLog({
    action: 'member.delete',
    actor: req.user,
    entityId: req.params.id,
    entityType: 'User',
    metadata: {
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
  })

  res.status(200).json({
    success: true,
    message: 'User soft deleted successfully.',
    data: {
      id: req.params.id,
    },
  })
})

const requestAccountDeletion = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    throw new AppError('User not found.', 404)
  }

  user.deleteRequestedAt = new Date()
  user.deleteRequestReason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
  await user.save()
  await recordAuditLog({
    action: 'member.delete.request',
    actor: req.user,
    entityId: user._id,
    entityType: 'User',
  })

  res.status(200).json({
    success: true,
    message: 'Delete account request submitted successfully.',
    data: { user },
  })
})

const getMyData = asyncHandler(async (req, res) => {
  const [payments, blogs, meetings, tours, donations] = await Promise.all([
    Payment.find({ user: req.user._id }),
    Blog.find({ createdBy: req.user._id }),
    Meeting.find({ 'attendance.member': req.user._id }),
    Tour.find({ 'participants.member': req.user._id }),
    Donation.find({ phone: req.user.phone }),
  ])

  res.status(200).json({
    success: true,
    message: 'Member data export loaded successfully.',
    data: {
      blogs,
      donations,
      meetings,
      payments,
      profile: req.user,
      tours,
    },
  })
})

const getMemberActivitySummary = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user._id
  const [paymentCount, attendedCount, blogCount, donationCount] = await Promise.all([
    Payment.countDocuments({ user: userId, status: 'verified' }),
    Meeting.countDocuments({ attendance: { $elemMatch: { member: userId, status: 'present' } } }),
    Blog.countDocuments({ createdBy: userId }),
    Donation.countDocuments({ phone: req.user.phone, status: 'verified' }),
  ])

  res.status(200).json({
    success: true,
    message: 'Member activity summary loaded successfully.',
    data: {
      attendedCount,
      blogCount,
      donationCount,
      paymentCount,
    },
  })
})

const resetUserPassword = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    throw new AppError('Use the account page to change your own password.', 400)
  }

  const payload = validateAdminPasswordReset(req.body)
  const user = await User.findById(req.params.id).select('+password')

  if (!user) {
    throw new AppError('User not found.', 404)
  }

  user.password = payload.newPassword
  await user.save()
  await createNotification({
    createdBy: req.user,
    link: '/account',
    message: 'An admin reset your password. Please log in with the new password and update it soon.',
    title: 'Password reset',
    type: 'account',
    user,
  })
  await recordAuditLog({
    action: 'member.password.reset',
    actor: req.user,
    entityId: user._id,
    entityType: 'User',
    metadata: {
      phone: user.phone,
      role: user.role,
    },
  })

  res.status(200).json({
    success: true,
    message: 'User password reset successfully.',
  })
})

module.exports = {
  deleteUser,
  getAllUsers,
  getApprovedMembers,
  getMemberActivitySummary,
  getMyData,
  requestAccountDeletion,
  resetUserPassword,
  updateUserAccess,
  verifyMemberPublic,
  updateMemberProfile,
}
