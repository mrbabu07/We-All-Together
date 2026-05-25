const Rule = require('../models/Rule')
const createContentController = require('./contentControllerFactory')
const { validateRule } = require('../validators/contentValidators')

module.exports = createContentController({
  model: Rule,
  validate: validateRule,
  sort: { order: 1, createdAt: -1 },
  name: 'Rule',
})
