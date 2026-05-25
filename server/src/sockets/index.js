const { verifyAccessToken } = require('../utils/tokenUtils')
const { markOffline, markOnline } = require('../services/presenceService')

const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token
    let userId = ''

    try {
      const decoded = token ? verifyAccessToken(token) : null
      userId = decoded?.id || ''
      markOnline(userId, {
        socketId: socket.id,
        userAgent: socket.handshake.headers['user-agent'] || '',
      })
      io.emit('presence:update')
    } catch {
      // Anonymous sockets can still receive public refresh events.
    }

    socket.on('disconnect', () => {
      markOffline(userId)
      io.emit('presence:update')
    })
  })
}

module.exports = {
  registerSocketHandlers,
}
