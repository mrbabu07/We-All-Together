const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const env = require('./config/env')
const apiRoutes = require('./routes')
const { errorHandler, notFound } = require('./middlewares/errorHandler')

const app = express()
const allowedOrigins = new Set(env.clientUrls)

app.use(helmet())
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked origin: ${origin}`))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Dargah Para OIkko Porishod API',
  })
})

app.use('/api/v1', apiRoutes)
app.use(notFound)
app.use(errorHandler)

module.exports = app
