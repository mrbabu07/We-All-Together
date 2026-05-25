const noticeController = require('../controllers/noticeController')
const createContentRoutes = require('./contentRouteFactory')

module.exports = createContentRoutes(noticeController)
