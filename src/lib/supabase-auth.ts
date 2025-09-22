import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Server-side Supabase client for authentication
export function getSupabaseAuth(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    console.error('Missing Supabase environment variables')
    return null
  }
  
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

// Client-side Supabase client for authentication
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    console.error('Missing Supabase environment variables')
    return null
  }
  
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
}

// User interface matching the existing structure
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  is_email_verified: boolean;
  preferences: string; // JSON string
  notification_settings: string; // JSON string
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Supabase Auth Service
export class SupabaseAuthService {
  // Create user account
  static async createUser(userData: CreateUserData): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      // Create user in Supabase Auth (without metadata to avoid trigger issues)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      })

      if (authError) {
        console.error('Auth signup error:', authError)
        return { success: false, message: authError.message }
      }

      if (!authData.user) {
        return { success: false, message: 'Failed to create user' }
      }

      // Create user profile in public.users table manually
      const defaultPreferences = JSON.stringify({
        currency: 'USD',
        units: 'imperial',
        theme: 'light'
      })
      
      const defaultNotificationSettings = JSON.stringify({
        email_alerts: true,
        push_notifications: true,
        weekly_digest: true,
        marketing_emails: false
      })

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          date_of_birth: userData.dateOfBirth,
          is_email_verified: false,
          preferences: defaultPreferences,
          notification_settings: defaultNotificationSettings
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        return { success: false, message: `Failed to create user profile: ${profileError.message}` }
      }

      return { 
        success: true, 
        message: 'User created successfully', 
        userId: authData.user.id 
      }

    } catch (error) {
      console.error('Error creating user:', error)
      return { success: false, message: 'Failed to create user' }
    }
  }

  // Login user
  static async loginUser(loginData: LoginData): Promise<{ success: boolean; message: string; user?: Omit<User, 'password'> }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      })

      if (authError) {
        console.error('Auth login error:', authError)
        return { success: false, message: 'Invalid email or password' }
      }

      if (!authData.user) {
        return { success: false, message: 'Login failed' }
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profileData) {
        console.error('Profile fetch error:', profileError)
        return { success: false, message: 'User profile not found' }
      }

      // Update last login
      await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      return { 
        success: true, 
        message: 'Login successful', 
        user: profileData 
      }

    } catch (error) {
      console.error('Error during login:', error)
      return { success: false, message: 'Login failed' }
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return null
      }

      // Guard against invalid identifiers like "null"/"NaN" that break uuid casts
      const bad = !id || id === 'null' || id === 'undefined' || id === 'NaN'
      if (bad) return null

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

  // Get user by email (fallback)
  static async getUserByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) return null
      if (!email) return null
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

  // Get current user from request (for API routes)
  static async getCurrentUser(request: NextRequest): Promise<{ userId: string; email: string; name: string } | null> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return null
      }

      // Get the session from the Authorization header or cookie
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '') || request.cookies.get('supabase-auth-token')?.value

      if (!token) {
        return null
      }

      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return null
      }

      // Get user profile for name
      const profile = await this.getUserById(user.id)
      if (!profile) {
        return null
      }

      return {
        userId: user.id,
        email: user.email!,
        name: `${profile.first_name} ${profile.last_name}`
      }

    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Logout user
  static async logoutUser(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

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

  // Reset password
  static async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`
      })

      if (error) {
        console.error('Password reset error:', error)
        return { success: false, message: error.message }
      }

      return { success: true, message: 'Password reset email sent' }

    } catch (error) {
      console.error('Error resetting password:', error)
      return { success: false, message: 'Failed to send reset email' }
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updateData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    bio?: string;
    avatar_url?: string;
    preferences?: any;
    notification_settings?: any;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const supabase = getSupabaseAuth()
      if (!supabase) {
        return { success: false, message: 'Supabase not configured' }
      }

      const updateFields: any = {
        updated_at: new Date().toISOString()
      }

      if (updateData.firstName) updateFields.first_name = updateData.firstName
      if (updateData.lastName) updateFields.last_name = updateData.lastName
      if (updateData.phone !== undefined) updateFields.phone = updateData.phone
      if (updateData.bio !== undefined) updateFields.bio = updateData.bio
      if (updateData.avatar_url !== undefined) updateFields.avatar_url = updateData.avatar_url
      if (updateData.preferences) updateFields.preferences = JSON.stringify(updateData.preferences)
      if (updateData.notification_settings) updateFields.notification_settings = JSON.stringify(updateData.notification_settings)

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
