const dns = require('node:dns')
const mongoose = require('mongoose')
const env = require('./env')

let connectionPromise = null

const connectDB = async () => {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is missing. Create server/.env from server/.env.example.')
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  if (connectionPromise) {
    return connectionPromise
  }

  mongoose.set('strictQuery', true)

  if (env.mongodbUri.startsWith('mongodb+srv://') && env.mongodbDnsServers.length) {
    dns.setServers(env.mongodbDnsServers)
  }

  connectionPromise = mongoose.connect(env.mongodbUri).catch((error) => {
    connectionPromise = null
    throw error
  })

  return connectionPromise
}

module.exports = connectDB
