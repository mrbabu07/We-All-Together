const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const { protect } = require('../middlewares/authMiddleware')
const { requirePermission } = require('../middlewares/permissionMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const guarded = (permission) =>
  permission ? requirePermission(permission) : authorize(USER_ROLES.ADMIN)

const createSimpleCrudRoutes = (controller, permission = '') => {
  const router = express.Router()

  router.get('/', controller.getPublicItems)
  router.get('/admin', protect, guarded(permission), controller.getAdminItems)
  router.post('/', protect, guarded(permission), controller.createItem)
  router.patch('/reorder', protect, guarded(permission), controller.reorderItems)
  router.put('/:id', protect, guarded(permission), controller.updateItem)
  router.patch('/:id', protect, guarded(permission), controller.updateItem)
  router.delete('/:id', protect, guarded(permission), controller.deleteItem)

  return router
}

module.exports = createSimpleCrudRoutes
