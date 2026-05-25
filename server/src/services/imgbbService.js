const env = require('../config/env')
const AppError = require('../utils/appError')

const uploadToImgBB = async ({ image, name }) => {
  if (typeof image !== 'string' || image.trim() === '') {
    throw new AppError('Image data is required.', 400)
  }

  if (!env.imgbbApiKey) {
    throw new AppError('IMGBB_API_KEY is missing.', 500)
  }

  const formData = new FormData()
  formData.append('image', image.replace(/^data:image\/[a-zA-Z]+;base64,/, ''))

  if (name) {
    formData.append('name', name)
  }

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${env.imgbbApiKey}`, {
    body: formData,
    method: 'POST',
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new AppError(result?.error?.message || 'Image upload failed.', 502)
  }

  return {
    deleteUrl: result.data.delete_url,
    displayUrl: result.data.display_url,
    url: result.data.url,
  }
}

module.exports = {
  uploadToImgBB,
}
