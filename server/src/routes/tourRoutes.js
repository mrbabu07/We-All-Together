const tourController = require('../controllers/tourController')
const createContentRoutes = require('./contentRouteFactory')

module.exports = createContentRoutes(tourController)
