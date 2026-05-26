import axios from 'axios'
import NProgress from 'nprogress'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
})

let activeRequests = 0

const startProgress = () => {
  activeRequests += 1
  NProgress.start()
}

const stopProgress = () => {
  activeRequests = Math.max(activeRequests - 1, 0)

  if (activeRequests === 0) {
    NProgress.done()
  }
}

NProgress.configure({ showSpinner: false, trickleSpeed: 120 })

api.interceptors.request.use(
  (config) => {
    startProgress()
    return config
  },
  (error) => {
    stopProgress()
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => {
    stopProgress()
    return response
  },
  (error) => {
    stopProgress()
    return Promise.reject(error)
  },
)

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
