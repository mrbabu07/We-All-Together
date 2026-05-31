const app = require('../src/app')
const connectDB = require('../src/config/db')
const { seedDefaultRoles } = require('../src/services/permissionService')

let bootPromise = null

const boot = async () => {
  if (!bootPromise) {
    bootPromise = connectDB().then(async () => {
      await seedDefaultRoles()
    })
  }

  return bootPromise
}

module.exports = async (req, res) => {
  try {
    await boot()
    return app(req, res)
  } catch (error) {
    console.error(`Vercel API boot failed: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: 'API failed to start.',
    })
  }
}
