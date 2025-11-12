import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;

    if (!access_token) {
      return NextResponse.json(
        { success: false, error: 'No access token provided' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Set the session with the tokens from the URL hash
    const { data: { user }, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError || !user) {
      console.error('[OAuth Callback API] Session error:', sessionError);
      return NextResponse.json(
        { success: false, error: sessionError?.message || 'Failed to create session' },
        { status: 401 }
      );
    }

    // Check if user profile exists in our database
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // If no profile exists, create one
    if (!existingProfile) {
      const firstName = user.user_metadata?.first_name || 
                       user.user_metadata?.given_name || 
                       user.user_metadata?.name?.split(' ')[0] || 
                       user.email?.split('@')[0] || 
                       'User';
      
      const lastName = user.user_metadata?.last_name || 
                      user.user_metadata?.family_name || 
                      user.user_metadata?.name?.split(' ').slice(1).join(' ') || 
                      '';

      await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        is_email_verified: user.email_confirmed_at ? true : false,
        date_of_birth: '2000-01-01', // Default date, user can update later
      });
    }

    // Create JWT payload for our custom auth system
    const jwtPayload = {
      userId: user.id, // UUID
      email: user.email || '',
      name: user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
            user.email?.split('@')[0] || 
            'User',
    };

    // Generate JWT token using our custom auth system
    const token = AuthService.generateToken(jwtPayload);

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: jwtPayload,
    });

    // Set the auth-token cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[OAuth Callback API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process OAuth callback' },
      { status: 500 }
    );
  }
}
