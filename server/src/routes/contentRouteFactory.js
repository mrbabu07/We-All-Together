const express = require('express')
const { USER_ROLES } = require('../constants/userConstants')
const { protect } = require('../middlewares/authMiddleware')
const { authorize } = require('../middlewares/roleMiddleware')

const createContentRoutes = (controller) => {
  const router = express.Router()

  router.get('/public', controller.getPublicItems)
  router.get(
    '/members',
    protect,
    authorize(USER_ROLES.ADMIN, USER_ROLES.MEMBER, USER_ROLES.MODERATOR),
    controller.getMemberItems,
  )
  router.post('/', protect, authorize(USER_ROLES.ADMIN), controller.createItem)
  router.patch('/:id', protect, authorize(USER_ROLES.ADMIN), controller.updateItem)
  router.delete('/:id', protect, authorize(USER_ROLES.ADMIN), controller.deleteItem)

  return router
}

module.exports = createContentRoutes
