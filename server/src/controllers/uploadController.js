const asyncHandler = require('../utils/asyncHandler')
const { uploadToImgBB } = require('../services/imgbbService')

const uploadImage = asyncHandler(async (req, res) => {
  const image = await uploadToImgBB({
    image: req.body.image,
    name: req.body.name,
  })

  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully.',
    data: {
      image,
    },
  })
})

module.exports = {
  uploadImage,
}
