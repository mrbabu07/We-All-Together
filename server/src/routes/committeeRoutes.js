const committeeController = require('../controllers/committeeController')
const createSimpleCrudRoutes = require('./simpleCrudRoutesFactory')

module.exports = createSimpleCrudRoutes(committeeController, 'homepage.committee')
