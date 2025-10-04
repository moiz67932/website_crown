"use client"

import { useState, useEffect } from 'react'
import { supaBrowser } from '@/lib/supabase'
import type { User } from '@/lib/supabase-auth'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
    
    // Listen for auth changes
  let supabase: any
  try { supabase = supaBrowser() } catch { /* not configured */ }
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const ok = await fetchUserProfile(session.user.id)
            if (!ok && session.user) {
              try {
                await fetch('/api/auth/ensure-profile', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                  body: JSON.stringify({ id: session.user.id, email: session.user.email, user_metadata: session.user.user_metadata }),
                })
                await fetchUserProfile(session.user.id)
              } catch (e) {
                console.error('ensure-profile request failed:', e)
              }
            }
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
  let supabase: any
  try { supabase = supaBrowser() } catch {}
      if (!supabase) {
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const ok = await fetchUserProfile(session.user.id)
        if (!ok && session.user) {
          try {
            await fetch('/api/auth/ensure-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ id: session.user.id, email: session.user.email, user_metadata: session.user.user_metadata }),
            })
            await fetchUserProfile(session.user.id)
          } catch (e) {
            console.error('ensure-profile request failed:', e)
          }
        }
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

  const fetchUserProfile = async (userId: string) : Promise<boolean> => {
    try {
  let supabase: any
  try { supabase = supaBrowser() } catch {}
  if (!supabase) return false

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error || !data) {
        console.error('Error fetching user profile:', error)
        setUser(null)
        setIsAuthenticated(false)
        return false
      }

      setUser(data)
      setIsAuthenticated(true)
      return true
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
      setIsAuthenticated(false)
      return false
    }
  }

  const login = async (email: string, password: string) => {
    try {
  let supabase: any
  try { supabase = supaBrowser() } catch {}
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
  let supabase: any
  try { supabase = supaBrowser() } catch {}
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
  let supabase: any
  try { supabase = supaBrowser() } catch {}
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
      let supabase: any
      try { supabase = supaBrowser() } catch {}
      if (!supabase) throw new Error('Supabase not configured')

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
