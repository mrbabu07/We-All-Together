const ruleController = require('../controllers/ruleController')
const createContentRoutes = require('./contentRouteFactory')

module.exports = createContentRoutes(ruleController)
