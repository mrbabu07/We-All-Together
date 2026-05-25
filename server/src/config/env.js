const path = require('path')
const dotenv = require('dotenv')

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
})

const toNumber = (value, fallback) => {
  const parsedValue = Number(value)
  return Number.isNaN(parsedValue) ? fallback : parsedValue
}

const env = {
  port: toNumber(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
  imgbbApiKey: process.env.IMGBB_API_KEY || '',
}

module.exports = env
