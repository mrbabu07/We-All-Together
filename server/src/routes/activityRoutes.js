const activityController = require('../controllers/activityController')
const createContentRoutes = require('./contentRouteFactory')

module.exports = createContentRoutes(activityController)
