const meetingController = require('../controllers/meetingController')
const createContentRoutes = require('./contentRouteFactory')

module.exports = createContentRoutes(meetingController)
