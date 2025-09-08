"use client"

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-auth'
import type { User } from '@/lib/supabase-auth'

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
    
    // Listen for auth changes
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserProfile(session.user.id)
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setIsAuthenticated(false)
          }
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [])

  const checkAuthStatus = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) {
        console.error('Error fetching user profile:', error)
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      setUser(data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.user) {
        await fetchUserProfile(data.user.id)
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
    }
  }

  const register = async (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    dateOfBirth: string
  }) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            date_of_birth: userData.dateOfBirth
          }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw new Error(error.message)
      }

      setUser(null)
      setIsAuthenticated(false)
      
      // Redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }

      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Logout failed' }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase not configured')
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Password reset failed' }
    }
  }

  const refreshAuth = () => {
    checkAuthStatus()
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    resetPassword,
    refreshAuth
  }
}
