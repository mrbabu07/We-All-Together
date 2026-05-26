const dns = require('node:dns')
const mongoose = require('mongoose')
const env = require('./env')

const connectDB = async () => {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is missing. Create server/.env from server/.env.example.')
  }

  mongoose.set('strictQuery', true)

  if (env.mongodbUri.startsWith('mongodb+srv://') && env.mongodbDnsServers.length) {
    dns.setServers(env.mongodbDnsServers)
  }

  const connection = await mongoose.connect(env.mongodbUri)
  return connection
}

module.exports = connectDB
