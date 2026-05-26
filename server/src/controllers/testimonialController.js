const Testimonial = require('../models/Testimonial')
const createSimpleCrudController = require('./simpleCrudControllerFactory')

module.exports = createSimpleCrudController({
  auditName: 'Testimonial',
  fields: [
    { name: 'active', type: 'boolean', default: true },
    { name: 'joinYear' },
    { name: 'name' },
    { name: 'order', type: 'number', default: 0 },
    { name: 'photo' },
    { name: 'text' },
  ],
  model: Testimonial,
})
