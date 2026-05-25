const Tour = require('../models/Tour')
const createContentController = require('./contentControllerFactory')
const { validateTour } = require('../validators/contentValidators')

module.exports = createContentController({
  model: Tour,
  validate: validateTour,
  sort: { startDate: 1 },
  name: 'Tour',
})
