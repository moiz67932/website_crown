import axios from 'axios'

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.crowncoastalhomes.com', // Set your default API base URL
  timeout: 10000, // Optional: request timeout in ms
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Optional: Add a request interceptor
axiosInstance.interceptors.request.use(
  config => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Optional: Add a response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // Handle global errors (e.g., unauthorized)
    if (error.response?.status === 401) {
      console.warn('Unauthorized, redirecting to login...')
      // Redirect logic or logout
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
