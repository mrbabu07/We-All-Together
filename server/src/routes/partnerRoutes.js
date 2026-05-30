const partnerController = require('../controllers/partnerController')
const createSimpleCrudRoutes = require('./simpleCrudRoutesFactory')

module.exports = createSimpleCrudRoutes(partnerController, 'homepage.partners')
