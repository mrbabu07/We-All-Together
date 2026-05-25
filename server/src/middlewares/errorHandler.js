const env = require('../config/env')

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Internal server error'

  if (error.code === 11000) {
    statusCode = 409
    message = 'Duplicate record already exists.'
  }

  if (error.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(' ')
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.nodeEnv === 'production' ? undefined : error.stack,
  })
}

module.exports = {
  notFound,
  errorHandler,
}
