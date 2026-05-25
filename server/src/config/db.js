const mongoose = require('mongoose')
const env = require('./env')

const connectDB = async () => {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is missing. Create server/.env from server/.env.example.')
  }

  mongoose.set('strictQuery', true)

  const connection = await mongoose.connect(env.mongodbUri)
  return connection
}

module.exports = connectDB
