const app = require('./app')
const connectDB = require('./config/db')
const env = require('./config/env')
const { Server } = require('socket.io')
const { registerSocketHandlers } = require('./sockets')
const { startAutoBackupJob } = require('./jobs/backupJobs')
const { startMonthlyFeeReminderScheduler } = require('./services/messageNotificationService')

let server

const startServer = async () => {
  try {
    await connectDB()
    console.log('MongoDB connected successfully')

    server = app.listen(env.port, () => {
      console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`)
    })
    const io = new Server(server, {
      cors: {
        origin: env.clientUrl,
        credentials: true,
      },
    })
    registerSocketHandlers(io)

    if (env.nodeEnv !== 'test') {
      startMonthlyFeeReminderScheduler()
      startAutoBackupJob()
    }
  } catch (error) {
    console.error(`Server failed to start: ${error.message}`)
    process.exit(1)
  }
}

process.on('unhandledRejection', (error) => {
  console.error(`Unhandled rejection: ${error.message}`)
  if (server) {
    server.close(() => process.exit(1))
    return
  }
  process.exit(1)
})

process.on('SIGTERM', () => {
  if (server) {
    server.close(() => {
      console.log('Server closed')
    })
  }
})

startServer()
