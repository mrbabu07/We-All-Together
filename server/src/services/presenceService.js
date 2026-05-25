const onlineUsers = new Map()

const markOnline = (userId, metadata = {}) => {
  if (!userId) {
    return
  }

  onlineUsers.set(String(userId), {
    ...metadata,
    lastSeenAt: new Date(),
    userId: String(userId),
  })
}

const markOffline = (userId) => {
  if (!userId) {
    return
  }

  onlineUsers.delete(String(userId))
}

const getOnlineSnapshot = () => ({
  count: onlineUsers.size,
  users: [...onlineUsers.values()],
})

module.exports = {
  getOnlineSnapshot,
  markOffline,
  markOnline,
}
