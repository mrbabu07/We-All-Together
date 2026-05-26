const testimonialController = require('../controllers/testimonialController')
const createSimpleCrudRoutes = require('./simpleCrudRoutesFactory')

module.exports = createSimpleCrudRoutes(testimonialController)
