import { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { ensureReferralCode, recordSignup } from '@/lib/referrals'
import { supaServer, supaBrowser } from '@/lib/supabase'

// Unified server auth client (service role) - never expose to browser
export function getSupabaseAuth(): SupabaseClient | null {
  try {
    return supaServer() as SupabaseClient
  } catch (e) {
    console.error('Supabase server init failed', e)
    return null
  }
}

// User interface matching the existing structure
export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  date_of_birth: string | null
  phone?: string | null
  bio?: string | null
  avatar_url?: string | null
  is_email_verified: boolean
  preferences: string // JSON string
  notification_settings: string // JSON string
  created_at: string
  updated_at: string
  last_login_at?: string | null
}

export interface CreateUserData {
  firstName: string
  lastName: string
  email: string
  password: string
  dateOfBirth: string | null
  referralCode?: string | null
}

export interface LoginData {
  email: string
  password: string
}

// Supabase Auth Service
export class SupabaseAuthService {
  // Create user account
  static async createUser(
    userData: CreateUserData
  ): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      let userId: string | undefined

      // 1) Try to create user in Supabase Auth
      const { data: created, error: adminErr } =
        await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            first_name: userData.firstName || null,
            last_name: userData.lastName || null,
            date_of_birth: userData.dateOfBirth || null,
          },
        })

      if (adminErr) {
        if (adminErr.code === 'email_exists') {
          // If already exists, list users and find the one with this email
          const { data: list, error: listErr } =
            await supabase.auth.admin.listUsers()
          if (listErr) {
            console.error('List users error:', listErr)
            return {
              success: false,
              message:
                'Email already registered but cannot resolve existing user',
            }
          }

          const existing = list.users.find(
            (u: any) =>
              u.email?.toLowerCase() === userData.email.toLowerCase()
          )
          if (!existing) {
            return {
              success: false,
              message:
                'Email already registered but user not found in admin list',
            }
          }

          userId = existing.id
        } else {
          console.error('Auth admin createUser error:', adminErr)
          return {
            success: false,
            message: adminErr?.message || 'Failed to create user',
          }
        }
      } else {
        userId = created?.user?.id
      }

      if (!userId) {
        return { success: false, message: 'User creation failed' }
      }

      // 2) Ensure a profile row in public.users (safe upsert)
      const defaultPreferences = JSON.stringify({
        currency: 'USD',
        units: 'imperial',
        theme: 'light',
      })

      const defaultNotificationSettings = JSON.stringify({
        email_alerts: true,
        push_notifications: true,
        weekly_digest: true,
        marketing_emails: false,
      })

      const { error: upsertErr } = await supabase
        .from('users')
        .upsert(
          {
            id: userId,
            email: userData.email,
            first_name: userData.firstName || 'New',
            last_name: userData.lastName || 'User',
            date_of_birth: userData.dateOfBirth || '1970-01-01',
            preferences: defaultPreferences,
            notification_settings: defaultNotificationSettings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

      if (upsertErr) {
        console.error('Profile upsert error:', upsertErr)
      }

      // 3) Referral attribution
      if (userData.referralCode) {
        try {
          const code = String(userData.referralCode || '')
            .trim()
            .toUpperCase()
          if (code) {
            const { data: rc } = await supabase
              .from('referral_codes')
              .select('user_id')
              .eq('code', code)
              .maybeSingle()

            const referrerUserId = rc?.user_id
            if (referrerUserId && referrerUserId !== userId) {
              await supabase
                .from('users')
                .update({ referrer_id: referrerUserId })
                .eq('id', userId)
                .is('referrer_id', null)

              await recordSignup(code, userId).catch(() => {})
            }
          }
        } catch (e) {
          console.warn('Referral attribution failed:', e)
        }
      }

      // 4) Ensure this user has their own referral code
      try {
        await ensureReferralCode(userId)
      } catch (e) {
        console.warn('ensureReferralCode failed:', e)
      }

      return { success: true, message: 'User created successfully', userId }
    } catch (error) {
      console.error('Error creating user:', error)
      return { success: false, message: 'Failed to create user' }
    }
  }

  // Login user
  static async loginUser(
    loginData: LoginData
  ): Promise<{ success: boolean; message: string; user?: Omit<User, 'password'> }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password,
        })

      if (authError) {
        console.error('Auth login error:', authError)
        return { success: false, message: 'Invalid email or password' }
      }

      if (!authData.user) {
        return { success: false, message: 'Login failed' }
      }

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profileData) {
        console.error('Profile fetch error:', profileError)
        return { success: false, message: 'User profile not found' }
      }

      await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id)

      return { success: true, message: 'Login successful', user: profileData }
    } catch (error) {
      console.error('Error during login:', error)
      return { success: false, message: 'Login failed' }
    }
  }

  static async getUserById(
    id: string
  ): Promise<Omit<User, 'password'> | null> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) return null

      if (!id || id === 'null' || id === 'undefined' || id === 'NaN')
        return null

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) {
        console.error('Error fetching user:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  static async getUserByEmail(
    email: string
  ): Promise<Omit<User, 'password'> | null> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase || !email) return null
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      if (error || !data) {
        if (error) console.error('Error fetching user by email:', error)
        return null
      }
      return data
    } catch (e) {
      console.error('Error getting user by email:', e)
      return null
    }
  }

  static async getCurrentUser(
    request: NextRequest
  ): Promise<{ userId: string; email: string; name: string } | null> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) return null

      const authHeader = request.headers.get('authorization')
      const token =
        authHeader?.replace('Bearer ', '') ||
        request.cookies.get('supabase-auth-token')?.value
      if (!token) return null

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)
      if (error || !user) return null

      const profile = await this.getUserById(user.id)
      if (!profile) return null

      return {
        userId: user.id,
        email: user.email!,
        name: `${profile.first_name} ${profile.last_name}`,
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  static async logoutUser(
    token: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase)
        return { success: false, message: 'Supabase not configured' }

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
        return { success: false, message: 'Logout failed' }
      }
      return { success: true, message: 'Logged out successfully' }
    } catch (error) {
      console.error('Error during logout:', error)
      return { success: false, message: 'Logout failed' }
    }
  }

  static async resetPassword(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // IMPORTANT: Use anon/public client for password reset flow.
      // The service role client (admin) is NOT required and causes missing key errors in browser contexts.
      let supabase
      try {
        supabase = supaBrowser()
      } catch (e) {
        console.error('Anon supabase init failed for reset password', e)
        return { success: false, message: 'Supabase not configured (public)' }
      }
      const redirectBase = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      let resetError: any = null
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${redirectBase}/auth/reset-password`,
        })
        resetError = error
      } catch (networkErr) {
        console.error('Network error during password reset:', networkErr)
        return { success: false, message: 'Network error sending reset email' }
      }
      if (resetError) {
        console.error('Password reset error:', resetError)
        return { success: false, message: resetError.message || 'Failed to send reset email' }
      }
      return { success: true, message: 'Password reset email sent' }
    } catch (error) {
      console.error('Error resetting password:', error)
      return { success: false, message: 'Failed to send reset email' }
    }
  }

  static async updateUserProfile(
    userId: string,
    updateData: {
      firstName?: string
      lastName?: string
      phone?: string
      bio?: string
      avatar_url?: string
      preferences?: any
      notification_settings?: any
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase)
        return { success: false, message: 'Supabase not configured' }

      const updateFields: any = { updated_at: new Date().toISOString() }
      if (updateData.firstName) updateFields.first_name = updateData.firstName
      if (updateData.lastName) updateFields.last_name = updateData.lastName
      if (updateData.phone !== undefined) updateFields.phone = updateData.phone
      if (updateData.bio !== undefined) updateFields.bio = updateData.bio
      if (updateData.avatar_url !== undefined)
        updateFields.avatar_url = updateData.avatar_url
      if (updateData.preferences)
        updateFields.preferences = JSON.stringify(updateData.preferences)
      if (updateData.notification_settings)
        updateFields.notification_settings = JSON.stringify(
          updateData.notification_settings
        )

      const { error } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', userId)
      if (error) {
        console.error('Profile update error:', error)
        return { success: false, message: 'Failed to update profile' }
      }
      return { success: true, message: 'Profile updated successfully' }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { success: false, message: 'Failed to update profile' }
    }
  }
}
