import React, { createContext, useState, useEffect, useContext } from 'react'
import api from '../services/api'

interface User {
  id: string
  nombre: string
  email: string
  rol: string
  zona_operacion?: string
  verificado: boolean
  foto_rostro_url?: string
  publicar_inventario?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, contrasena: string) => Promise<void>
  register: (nombre: string, email: string, contrasena: string, rol: string, zona: string, cedula?: string | null, fotoCedulaUrl?: string | null, fotoRostroUrl?: string | null) => Promise<void>
  verificarIdentidíad: (cedula: string, fotoCedulaUrl: string, fotoRostroUrl: string) => Promise<void>
  logout: () => void
  deleteAccount: () => Promise<void>
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      const payload = parseJwt(savedToken)
      if (payload && payload.exp * 1000 > Date.now()) {
        setToken(savedToken)
        setUser({
          id: payload.user_id || payload.sub,
          nombre: payload.nombre || 'Usuario',
          email: payload.email || '',
          rol: payload.rol,
          zona_operacion: payload.zona_operacion,
          verificado: payload.verificado || false,
        })
      } else {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, contrasena: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', contrasena)
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    const { access_token } = response.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    
    const payload = parseJwt(access_token)
    setUser({
      id: payload.user_id || payload.sub,
      nombre: payload.nombre || 'Usuario',
      email: payload.email || '',
      rol: payload.rol,
      zona_operacion: payload.zona_operacion,
      verificado: payload.verificado || false,
    })
  }

  const register = async (nombre: string, email: string, contrasena: string, rol: string, zona: string, cedula?: string | null, fotoCedulaUrl?: string | null, fotoRostroUrl?: string | null) => {
    await api.post('/auth/register', {
      nombre,
      email,
      password: contrasena,
      rol,
      zona_operacion: zona,
      cedula,
      foto_cedula_url: fotoCedulaUrl,
      foto_rostro_url: fotoRostroUrl
    })
  }

  const verificarIdentidíad = async (cedula: string, fotoCedulaUrl: string, fotoRostroUrl: string) => {
    await api.put('/auth/verificar-identidíad', {
      cedula,
      foto_cedula_url: fotoCedulaUrl,
      foto_rostro_url: fotoRostroUrl
    })
    
    // Al verificar, lo ideal sería pedir un nuevo token o simplemente refrescar la sesión local
    if (user) {
      setUser({ ...user, verificado: true })
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const deleteAccount = async () => {
    if (!token) return
    await api.delete('/auth/me')
    logout()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, verificarIdentidíad, logout, deleteAccount, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
