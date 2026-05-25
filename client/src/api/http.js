import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
})

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  )
}

export default api
