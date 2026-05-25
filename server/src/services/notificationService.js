const Notification = require('../models/Notification')
const User = require('../models/User')
const { USER_STATUSES } = require('../constants/userConstants')

const getUserId = (user) => {
  if (!user) {
    return null
  }

  return user._id || user
}

const createNotification = async ({
  createdBy = null,
  link = '',
  message,
  title,
  type = 'general',
  user,
}) => {
  const userId = getUserId(user)

  if (!userId) {
    return null
  }

  try {
    return await Notification.create({
      createdBy: getUserId(createdBy),
      link,
      message,
      title,
      type,
      user: userId,
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Notification failed:', error.message)
    }
    return null
  }
}

const broadcastNotification = async ({
  createdBy = null,
  link = '',
  message,
  role,
  title,
  type = 'general',
}) => {
  const filter = {
    status: USER_STATUSES.APPROVED,
  }

  if (role) {
    filter.role = role
  }

  const users = await User.find(filter).select('_id')

  if (!users.length) {
    return 0
  }

  const notifications = users.map((user) => ({
    createdBy: getUserId(createdBy),
    link,
    message,
    title,
    type,
    user: user._id,
  }))

  await Notification.insertMany(notifications, { ordered: false })

  return notifications.length
}

module.exports = {
  broadcastNotification,
  createNotification,
}
