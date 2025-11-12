// Social Authentication Service for OAuth (Google, Facebook)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type SocialProvider = 'google' | 'facebook' | 'apple' | 'twitter' | 'github'

export interface SocialAuthOptions {
  provider: SocialProvider
  redirectTo?: string
  scopes?: string
}

export interface SocialAuthResult {
  success: boolean
  user?: any
  session?: any
  error?: string
  url?: string
}

/**
 * Initialize social login (redirect to OAuth provider)
 */
export async function initiateSocialLogin(options: SocialAuthOptions): Promise<SocialAuthResult> {
  try {
    const { provider, redirectTo, scopes } = options
    
    // Get the current origin
    const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${origin}/auth/callback`,
        scopes: scopes || undefined,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error(`[SocialAuth] ${provider} login error:`, error)
      return { success: false, error: error.message }
    }

    if (data.url) {
      return { success: true, url: data.url }
    }

    return { success: false, error: 'No redirect URL returned' }
  } catch (error: any) {
    console.error('[SocialAuth] Unexpected error:', error)
    return { success: false, error: error.message || 'Unknown error occurred' }
  }
}

/**
 * Handle OAuth callback after redirect
 */
export async function handleOAuthCallback(): Promise<SocialAuthResult> {
  try {
    // Exchange the code for a session
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[SocialAuth] Callback error:', error)
      return { success: false, error: error.message }
    }

    if (!data.session) {
      return { success: false, error: 'No session found' }
    }

    // Store social connection in database
    await storeSocialConnection(data.session)

    return {
      success: true,
      user: data.session.user,
      session: data.session,
    }
  } catch (error: any) {
    console.error('[SocialAuth] Callback processing error:', error)
    return { success: false, error: error.message || 'Failed to process callback' }
  }
}

/**
 * Store social connection details in the database
 */
async function storeSocialConnection(session: any) {
  try {
    const user = session.user
    const provider = user.app_metadata?.provider || 'unknown'
    const providerToken = session.provider_token
    const providerRefreshToken = session.provider_refresh_token

    // Get or create user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      // Create user profile
      await supabase.from('user_profiles').insert({
        user_id: user.id,
        first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || '',
        last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      })
    }

    // Store or update social connection
    await supabase.from('user_social_connections').upsert({
      user_id: user.id,
      provider,
      provider_id: user.id, // Supabase uses same ID
      provider_email: user.email,
      provider_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      provider_avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      access_token: providerToken,
      refresh_token: providerRefreshToken,
      token_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      raw_user_meta_data: user.user_metadata,
      last_used_at: new Date().toISOString(),
    }, {
      onConflict: 'provider,provider_id',
    })
  } catch (error) {
    console.error('[SocialAuth] Error storing social connection:', error)
  }
}

/**
 * Get user's social connections
 */
export async function getUserSocialConnections(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_social_connections')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return { success: true, connections: data }
  } catch (error: any) {
    console.error('[SocialAuth] Error fetching connections:', error)
    return { success: false, error: error.message, connections: [] }
  }
}

/**
 * Disconnect a social provider
 */
export async function disconnectSocialProvider(userId: string, provider: string) {
  try {
    const { error } = await supabase
      .from('user_social_connections')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('[SocialAuth] Error disconnecting provider:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<SocialAuthResult> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) throw error
    
    return { success: true, session: data.session, user: data.session?.user }
  } catch (error: any) {
    return { success: false, error: error.message, session: null, user: null }
  }
}
