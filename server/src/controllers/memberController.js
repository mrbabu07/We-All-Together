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

module.exports = {
  getAllUsers,
  getApprovedMembers,
  updateMemberProfile,
}
