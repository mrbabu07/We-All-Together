const Achievement = require('../models/Achievement')
const createSimpleCrudController = require('./simpleCrudControllerFactory')

module.exports = createSimpleCrudController({
  auditName: 'Achievement',
  fields: [
    { name: 'active', type: 'boolean', default: true },
    { name: 'description' },
    { name: 'order', type: 'number', default: 0 },
    { name: 'photo' },
    { name: 'title' },
    { name: 'year' },
  ],
  model: Achievement,
})
