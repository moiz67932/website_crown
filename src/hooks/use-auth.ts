"use client"

import { useState, useEffect } from 'react'
import { ClientAuthService } from '../lib/auth'
import type { JWTPayload } from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<JWTPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    setIsLoading(true)
    try {
      const currentUser = await ClientAuthService.getCurrentUser()
      setUser(currentUser)
      setIsAuthenticated(!!currentUser)
    } catch (error: any) {
      // Silently handle 401 style errors; only log unexpected ones
      if (error?.status && error.status !== 401) {
        console.error('Error checking auth status:', error)
      }
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await ClientAuthService.logout()
      setUser(null)
      setIsAuthenticated(false)
      // Optionally redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const refreshAuth = () => {
    checkAuthStatus()
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    refreshAuth
  }
}