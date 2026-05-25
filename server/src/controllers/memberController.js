const { USER_ROLES, USER_STATUSES } = require('../constants/userConstants')
const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')

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

const updateMemberProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('Member not found.', 404)
  }

  const allowedFields = ['name', 'phone', 'address']
  allowedFields.forEach((field) => {
    if (typeof req.body[field] === 'string' && req.body[field].trim()) {
      user[field] = req.body[field].trim()
    }
  })

  await user.save()

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

  await user.deleteOne()

  res.status(200).json({
    success: true,
    message: 'User deleted successfully.',
    data: {
      id: req.params.id,
    },
  })
})

module.exports = {
  deleteUser,
  getAllUsers,
  getApprovedMembers,
  updateUserAccess,
  updateMemberProfile,
}
