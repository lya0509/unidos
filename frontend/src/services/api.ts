import axios from 'axios'

const IS_DEV = import.meta.env.DEV
const API_BASE_URL = IS_DEV ? '/api/v1' : (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepta peticiones para agregar el token JWT si está disponible
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export const getSocketUrl = (path: string = '') => {
  if (IS_DEV) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/api/v1${path}`
  } else {
    const base = import.meta.env.VITE_API_URL || ''
    const wsProtocol = base.startsWith('https') ? 'wss:' : 'ws:'
    const rawHost = base.replace(/^https?:\/\//, '')
    return `${wsProtocol}//${rawHost}${path}`
  }
}

export default api
