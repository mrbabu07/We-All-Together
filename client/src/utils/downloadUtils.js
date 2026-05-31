const fallbackFilename = 'download'

const sanitizeFilename = (filename = fallbackFilename) =>
  String(filename || fallbackFilename)
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim() || fallbackFilename

export const filenameFromContentDisposition = (disposition = '', fallback = fallbackFilename) => {
  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)

  if (encodedMatch?.[1]) {
    try {
      return sanitizeFilename(decodeURIComponent(encodedMatch[1].trim().replace(/^"|"$/g, '')))
    } catch {
      return sanitizeFilename(encodedMatch[1])
    }
  }

  const plainMatch = disposition.match(/filename="?([^";]+)"?/i)
  return sanitizeFilename(plainMatch?.[1] || fallback)
}

export const downloadBlob = (data, filename, mimeType = '') => {
  const blob =
    data instanceof Blob
      ? data
      : new Blob([data], mimeType ? { type: mimeType } : undefined)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = sanitizeFilename(filename)
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export const downloadResponseBlob = (response, fallbackFilenameValue, mimeType = '') => {
  const filename = filenameFromContentDisposition(
    response.headers?.['content-disposition'] || '',
    fallbackFilenameValue,
  )

  downloadBlob(response.data, filename, mimeType)
}

export const downloadDataUrl = (dataUrl, filename) => {
  const link = document.createElement('a')

  link.href = dataUrl
  link.download = sanitizeFilename(filename)
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
