# Supabase Authentication Migration Guide

This guide explains how to migrate from SQLite-based authentication to Supabase authentication while keeping the UI and user experience the same.

## What Changed

### 1. Database Migration
- **From**: SQLite database with local user storage
- **To**: Supabase PostgreSQL with built-in authentication

### 2. Authentication Flow
- **From**: Custom JWT tokens with SQLite user verification
- **To**: Supabase Auth with automatic session management

### 3. User Management
- **From**: Manual password hashing and user creation
- **To**: Supabase Auth handles password security and user creation

## Setup Instructions

### 1. Create Supabase Project
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Note down your project URL and API keys

### 2. Set Up Database Schema
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `supabase-schema.sql` to create the users table and necessary functions

### 3. Configure Environment Variables
Add these to your `.env.local` file:

```env
# Server-side Supabase configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Client-side Supabase configuration (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Update Authentication Settings
In your Supabase project dashboard:
1. Go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs for password reset (e.g., `http://localhost:3000/auth/reset-password`)

## Files Modified

### New Files Created
- `src/lib/supabase-auth.ts` - Supabase authentication service
- `src/hooks/use-supabase-auth.ts` - Client-side Supabase auth hook
- `src/components/providers/supabase-provider.tsx` - Supabase context provider
- `src/app/api/auth/forgot-password/route.ts` - Password reset API endpoint
- `supabase-schema.sql` - Database schema for Supabase

### Files Updated
- `src/app/api/auth/login/route.ts` - Now uses Supabase for authentication
- `src/app/api/auth/register/route.ts` - Now uses Supabase for user creation
- `src/app/api/auth/me/route.ts` - Now fetches user data from Supabase
- `src/app/api/user/profile/route.ts` - Now updates user data in Supabase
- `src/app/auth/forgot-password/forgot-password-form.tsx` - Now calls real API
- `src/components/providers.tsx` - Added Supabase provider
- `env.example` - Added Supabase environment variables

## Key Features Maintained

### 1. Same UI/UX
- All login, registration, and forgot password forms remain identical
- Same validation rules and error handling
- Same styling and user experience

### 2. Same API Endpoints
- `/api/auth/login` - Login endpoint
- `/api/auth/register` - Registration endpoint
- `/api/auth/me` - Get current user
- `/api/user/profile` - Update user profile
- `/api/auth/forgot-password` - Password reset (new)

### 3. Same Data Structure
- User profiles maintain the same fields
- Preferences and notification settings preserved
- Same JWT token structure for session management

## Benefits of Migration

### 1. Enhanced Security
- Supabase handles password hashing and security best practices
- Built-in protection against common attacks
- Automatic session management

### 2. Scalability
- PostgreSQL database can handle more concurrent users
- Built-in connection pooling
- Automatic backups and maintenance

### 3. Additional Features
- Email verification out of the box
- Password reset functionality
- Social authentication ready (Google, Facebook, etc.)
- Admin dashboard for user management

### 4. Developer Experience
- Real-time subscriptions
- Built-in API documentation
- Easy database management
- Comprehensive logging and monitoring

## Testing the Migration

### 1. Test Registration
1. Go to `/auth/resgister`
2. Fill out the registration form
3. Verify user is created in Supabase dashboard
4. Check that email verification is sent (if enabled)

### 2. Test Login
1. Go to `/auth/login`
2. Use the credentials from registration
3. Verify successful login and session creation
4. Check that user data is properly loaded

### 3. Test Profile Management
1. Login and go to `/profile`
2. Update profile information
3. Verify changes are saved in Supabase

### 4. Test Password Reset
1. Go to `/auth/forgot-password`
2. Enter a registered email
3. Check email for reset link
4. Follow reset link and set new password

## Troubleshooting

### Common Issues

1. **"Supabase not configured" error**
   - Check that all environment variables are set correctly
   - Verify the Supabase project URL and keys

2. **User creation fails**
   - Ensure the database schema is properly set up
   - Check that RLS policies allow user creation

3. **Login fails**
   - Verify email/password combination
   - Check Supabase Auth logs for detailed error messages

4. **Session not persisting**
   - Ensure client-side environment variables are set
   - Check that the Supabase provider is properly configured

### Getting Help

- Check Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Review the Supabase dashboard logs for detailed error messages
- Ensure all environment variables are correctly configured

## Next Steps

After successful migration, you can:

1. Enable email verification in Supabase settings
2. Add social authentication providers
3. Implement real-time features using Supabase subscriptions
4. Set up database backups and monitoring
5. Configure custom email templates for auth emails
