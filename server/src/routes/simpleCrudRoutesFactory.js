const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const createSimpleCrudRoutes = (controller) => {
  const router = express.Router()

  router.get('/', controller.getPublicItems)
  router.get('/admin', protect, authorize(USER_ROLES.ADMIN), controller.getAdminItems)
  router.post('/', protect, authorize(USER_ROLES.ADMIN), controller.createItem)
  router.put('/:id', protect, authorize(USER_ROLES.ADMIN), controller.updateItem)
  router.patch('/:id', protect, authorize(USER_ROLES.ADMIN), controller.updateItem)
  router.delete('/:id', protect, authorize(USER_ROLES.ADMIN), controller.deleteItem)

  return router
}

module.exports = createSimpleCrudRoutes
