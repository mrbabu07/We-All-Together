const mongoose = require('mongoose')

const connectionStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dargah Para API is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: connectionStates[mongoose.connection.readyState] || 'unknown',
    },
  })
}

module.exports = {
  getHealth,
}
