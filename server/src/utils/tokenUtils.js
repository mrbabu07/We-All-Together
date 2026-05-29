const jwt = require('jsonwebtoken')
const env = require('../config/env')
const AppError = require('./appError')

const ensureJwtSecret = () => {
  if (!env.jwtAccessSecret) {
    throw new AppError('JWT_ACCESS_SECRET is missing.', 500)
  }
}

const generateAccessToken = (user) => {
  ensureJwtSecret()

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      sessionVersion: Number(user.sessionVersion || 0),
      status: user.status,
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.jwtAccessExpiresIn,
    },
  )
}

const verifyAccessToken = (token) => {
  ensureJwtSecret()
  return jwt.verify(token, env.jwtAccessSecret)
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
}
