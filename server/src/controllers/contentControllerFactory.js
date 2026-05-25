const { AUDIENCES } = require('../constants/contentConstants')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/appError')

const createContentController = ({ model, validate, sort = { createdAt: -1 }, name }) => {
  const getPublicItems = asyncHandler(async (req, res) => {
    const items = await model.find({ audience: AUDIENCES.PUBLIC }).sort(sort)

    res.status(200).json({
      success: true,
      message: `${name} loaded successfully.`,
      data: {
        items,
      },
    })
  })

  const getMemberItems = asyncHandler(async (req, res) => {
    const items = await model.find().sort(sort)

    res.status(200).json({
      success: true,
      message: `${name} loaded successfully.`,
      data: {
        items,
      },
    })
  })

  const createItem = asyncHandler(async (req, res) => {
    const payload = validate(req.body)
    const item = await model.create({
      ...payload,
      createdBy: req.user._id,
    })

    res.status(201).json({
      success: true,
      message: `${name} created successfully.`,
      data: {
        item,
      },
    })
  })

  const updateItem = asyncHandler(async (req, res) => {
    const payload = validate(req.body)
    const item = await model.findById(req.params.id)

    if (!item) {
      throw new AppError(`${name} not found.`, 404)
    }

    Object.assign(item, payload)
    await item.save()

    res.status(200).json({
      success: true,
      message: `${name} updated successfully.`,
      data: {
        item,
      },
    })
  })

  const deleteItem = asyncHandler(async (req, res) => {
    const item = await model.findById(req.params.id)

    if (!item) {
      throw new AppError(`${name} not found.`, 404)
    }

    await item.deleteOne()

    res.status(200).json({
      success: true,
      message: `${name} deleted successfully.`,
      data: {
        id: req.params.id,
      },
    })
  })

  return {
    createItem,
    deleteItem,
    getMemberItems,
    getPublicItems,
    updateItem,
  }
}

module.exports = createContentController
