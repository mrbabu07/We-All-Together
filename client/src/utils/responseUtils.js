export const apiData = (response, fallback = {}) => response?.data?.data ?? fallback

export const apiArray = (response, key, fallback = []) => {
  const value = key ? apiData(response)?.[key] : apiData(response)
  return Array.isArray(value) ? value : fallback
}

export const apiObject = (response, key, fallback = {}) => {
  const value = key ? apiData(response)?.[key] : apiData(response)
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
}

export const apiValue = (response, key, fallback = null) => apiData(response)?.[key] ?? fallback

export const apiUploadUrl = (response) => response?.data?.data?.image?.url || ''

export const safeJsonStringify = (value, fallback = '{}') => {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return fallback
  }
}
