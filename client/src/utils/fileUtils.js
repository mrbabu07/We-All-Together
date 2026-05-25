import imageCompression from 'browser-image-compression'

const maybeCompressImage = async (file) => {
  if (!file?.type?.startsWith('image/')) {
    return file
  }

  return imageCompression(file, {
    maxSizeMB: 0.85,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  })
}

export const readFileAsDataUrl = async (file) => {
  const selectedFile = await maybeCompressImage(file)

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(selectedFile)
  })
}
