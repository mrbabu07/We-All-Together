const achievementController = require('../controllers/achievementController')
const createSimpleCrudRoutes = require('./simpleCrudRoutesFactory')

module.exports = createSimpleCrudRoutes(achievementController, 'homepage.achievements')
