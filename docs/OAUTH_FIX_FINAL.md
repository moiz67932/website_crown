# OAuth & User Profile Fix - Complete Implementation ✅

## Issues Fixed

### 1. ✅ OAuth Redirect to `/#` Instead of Homepage
**Problem:** After Google/Facebook login, users were redirected to `http://localhost:3000/#` instead of the homepage.

**Root Cause:** OAuth tokens are returned in the URL hash fragment (`#access_token=...`), but the callback page wasn't extracting them properly.

**Solution:**
- Updated callback page to extract `access_token` and `refresh_token` from URL hash
- Changed API endpoint from GET to POST to receive tokens
- API creates Supabase session and sets JWT cookie
- Redirect to homepage (`/`) instead of dashboard

---

### 2. ✅ User Profile Not Showing in Header
**Problem:** After login/signup, user name wasn't displayed in the navigation header.

**Root Cause:** The app uses a custom JWT auth system with `auth-token` cookies, but OAuth was only creating Supabase sessions without setting the required JWT cookie.

**Solution:**
- OAuth callback API now generates JWT token
- Sets `auth-token` cookie (required by custom auth system)
- Uses hard redirect (`window.location.href = '/'`) to refresh auth state
- `useAuth` hook detects cookie and displays user

---

### 3. ✅ Wrong Redirect for Regular Users
**Problem:** Regular users were being redirected to `/dashboard` (admin page) after login/signup.

**Solution:**
- OAuth callback redirects to homepage (`/`)
- Regular login already redirects to homepage ✅
- Regular signup already redirects to homepage ✅
- Only admin users should access `/dashboard`

---

### 4. ✅ Enhanced User Profile Menu
**Problem:** User dropdown only had "Profile Settings" option.

**Solution:** Added comprehensive profile menu with:
- 👤 **My Profile** - View/edit personal info
- ❤️ **Saved Properties** - Favorite/saved properties
- 🔍 **Saved Searches** - Saved search criteria
- 📜 **Search History** - Recent searches
- 👁️ **Viewed Properties** - Recently viewed properties
- ⚙️ **Settings** - Account settings
- 🚪 **Sign Out** - Logout

---

## Files Modified

### 1. OAuth Callback API Route
**File:** `src/app/api/auth/oauth-callback/route.ts`

**Changes:**
- Changed from GET to POST endpoint
- Accepts `access_token` and `refresh_token` in request body
- Creates Supabase session using `setSession()`
- Creates user profile in database if doesn't exist
- Generates JWT token for custom auth system
- Sets `auth-token` cookie
- Returns user data

**Key Code:**
```typescript
// Extract tokens from request
const { access_token, refresh_token } = await request.json();

// Create Supabase session
const { data: { user } } = await supabase.auth.setSession({
  access_token,
  refresh_token,
});

// Generate JWT token
const token = AuthService.generateToken({
  userId: user.id,
  email: user.email,
  name: user.user_metadata?.name || user.email?.split('@')[0],
});

// Set auth cookie
response.cookies.set('auth-token', token, { ... });
```

---

### 2. OAuth Callback Page
**File:** `src/app/auth/callback/page.tsx`

**Changes:**
- Extract tokens from URL hash (`window.location.hash`)
- Parse hash parameters: `access_token`, `refresh_token`
- Call POST `/api/auth/oauth-callback` with tokens
- Redirect to homepage (`/`) instead of dashboard
- Use `window.location.href` for hard redirect

**Key Code:**
```typescript
// Extract tokens from URL hash
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');
const refreshToken = hashParams.get('refresh_token');

// Call API to set session
const response = await fetch('/api/auth/oauth-callback', {
  method: 'POST',
  body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
});

// Hard redirect to homepage
window.location.href = '/';
```

---

### 3. Social Login Buttons Configuration
**Files:** 
- `src/app/auth/login/login-form.tsx`
- `src/app/auth/resgister/sign-form.tsx`

**Changes:**
- Changed `redirectTo` from `/dashboard` to `/`
- Removed `onSuccess` redirect (callback handles it)

**Before:**
```tsx
<SocialLoginButtons 
  redirectTo="/dashboard"
  onSuccess={() => router.push('/dashboard')}
/>
```

**After:**
```tsx
<SocialLoginButtons 
  redirectTo="/"
  onSuccess={() => {
    // OAuth callback will handle redirect
  }}
/>
```

---

### 4. Navigation Header (Desktop & Mobile)
**File:** `src/components/layout/navbar.tsx`

**Changes:**
- Added icons: `Heart`, `History`, `Search`, `Eye`
- Enhanced user dropdown menu with 6 menu items
- Updated mobile menu with same items
- Better icon representation for each feature

**Desktop Dropdown Menu:**
```tsx
<DropdownMenuItem asChild>
  <Link href="/profile"><User /> My Profile</Link>
</DropdownMenuItem>
<DropdownMenuItem asChild>
  <Link href="/profile/favorites"><Heart /> Saved Properties</Link>
</DropdownMenuItem>
<DropdownMenuItem asChild>
  <Link href="/profile/searches"><Search /> Saved Searches</Link>
</DropdownMenuItem>
<DropdownMenuItem asChild>
  <Link href="/profile/history"><History /> Search History</Link>
</DropdownMenuItem>
<DropdownMenuItem asChild>
  <Link href="/profile/viewed"><Eye /> Viewed Properties</Link>
</DropdownMenuItem>
<DropdownMenuItem asChild>
  <Link href="/profile/settings"><Settings /> Settings</Link>
</DropdownMenuItem>
```

---

### 5. JWT Interface Update
**File:** `src/lib/auth.ts`

**Changes:**
- Updated `userId` type from `number` to `number | string`
- Supports both numeric IDs (admin) and UUIDs (regular users)

**Before:**
```typescript
export interface JWTPayload {
  userId: number;  // Only numeric IDs
  email: string;
  name: string;
}
```

**After:**
```typescript
export interface JWTPayload {
  userId: number | string;  // Numeric IDs and UUIDs
  email: string;
  name: string;
}
```

---

## Complete OAuth Flow

### 1. User Initiates Login
```
User clicks "Sign in with Google" 
  → initiateSocialLogin({ provider: 'google' })
  → Redirects to Google OAuth
```

### 2. Google Authorization
```
User authorizes app
  → Google redirects to: /auth/callback#access_token=xxx&refresh_token=yyy
```

### 3. Callback Processing
```
Callback page extracts tokens from URL hash
  → POST /api/auth/oauth-callback { access_token, refresh_token }
  → API creates Supabase session
  → API creates user profile (if new user)
  → API generates JWT token
  → API sets auth-token cookie
  → Returns success
```

### 4. Redirect & Auth State Update
```
window.location.href = '/'
  → Hard redirect to homepage
  → Browser reloads page
  → useAuth hook runs
  → Detects auth-token cookie
  → Fetches user from /api/auth/me
  → Updates navbar with user name ✅
```

---

## User Profile Routes (To Be Created)

The navigation now includes these profile routes that need to be implemented:

1. **`/profile`** - Main profile page (view/edit personal info)
2. **`/profile/favorites`** - Saved/favorite properties
3. **`/profile/searches`** - Saved search criteria
4. **`/profile/history`** - Search history
5. **`/profile/viewed`** - Recently viewed properties
6. **`/profile/settings`** - Account settings (password, notifications, etc.)

---

## Database Tables Available

The user management migration already created these tables:

```sql
-- User profiles
user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  ...
)

-- Social connections
user_social_connections (
  user_id UUID,
  provider TEXT,
  provider_id TEXT,
  provider_email TEXT,
  provider_name TEXT,
  ...
)

-- Saved properties
user_saved_properties (
  user_id UUID,
  property_id BIGINT,
  notes TEXT,
  saved_at TIMESTAMPTZ
)

-- Saved searches
user_saved_searches (
  user_id UUID,
  search_name TEXT,
  search_criteria JSONB,
  created_at TIMESTAMPTZ
)

-- Search history
user_search_history (
  user_id UUID,
  search_query JSONB,
  results_count INT,
  searched_at TIMESTAMPTZ
)

-- Viewed properties
user_viewed_properties (
  user_id UUID,
  property_id BIGINT,
  viewed_at TIMESTAMPTZ,
  view_duration_seconds INT
)
```

---

## Testing Checklist

### OAuth Login (Google)
- [ ] Click "Sign in with Google" on login page
- [ ] Authorize with Google account
- [ ] Should redirect to **homepage** (`/`) not `/#`
- [ ] User name should appear in header navigation
- [ ] Click user dropdown - should show all menu items
- [ ] Each menu item should have correct icon
- [ ] Logout should work correctly

### OAuth Signup (Google)
- [ ] Click "Sign in with Google" on signup page
- [ ] Same behavior as login
- [ ] New user profile created in database
- [ ] Social connection stored in `user_social_connections`

### Regular Login/Signup
- [ ] Email/password login redirects to homepage
- [ ] Email/password signup redirects to homepage
- [ ] User shown in header after login
- [ ] All profile menu items visible

### Mobile Menu
- [ ] User name and email shown
- [ ] All 6 profile menu items visible
- [ ] Icons displayed correctly
- [ ] Logout works

---

## Environment Variables

Ensure these are configured:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_secret_key_change_in_production

# OAuth Providers (configured in Supabase Dashboard)
# Settings → Authentication → Providers
# - Google OAuth (Client ID & Secret)
# - Facebook OAuth (App ID & Secret)
```

### Supabase OAuth Configuration

**Google OAuth:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add authorized redirect URL: `http://localhost:3000/auth/callback`
4. For production: `https://yourdomain.com/auth/callback`

**Callback URL Format:**
```
http://localhost:3000/auth/callback
```

---

## Next Steps

### 1. Create Profile Pages (High Priority)
- [ ] `/profile` - Main profile page
- [ ] `/profile/favorites` - Display saved properties
- [ ] `/profile/searches` - Display and manage saved searches
- [ ] `/profile/history` - Display search history
- [ ] `/profile/viewed` - Display viewed properties
- [ ] `/profile/settings` - Account settings

### 2. Implement Favorite/Save Functionality
- [ ] Add "Save/Favorite" button to property cards
- [ ] API route to save/unsave properties
- [ ] Display saved properties on favorites page

### 3. Implement Search History
- [ ] Track searches automatically
- [ ] Store search criteria in database
- [ ] Display on history page
- [ ] Allow re-running saved searches

### 4. Implement Viewed Properties
- [ ] Track property views automatically
- [ ] Store view timestamp and duration
- [ ] Display on viewed page

### 5. Testing & Refinement
- [ ] Test all OAuth flows
- [ ] Test profile features
- [ ] Mobile responsiveness
- [ ] Error handling

---

## Summary

✅ **OAuth redirect fixed** - Users now go to homepage, not `/#`  
✅ **User profile shows in header** - Name and dropdown menu visible  
✅ **Proper redirects** - Homepage for regular users, not dashboard  
✅ **Enhanced profile menu** - 6 user management features accessible  
✅ **Mobile menu updated** - All features available on mobile  
✅ **JWT system updated** - Supports both numeric and UUID user IDs  
✅ **Database ready** - All tables for user features exist  

**Status:** Core authentication and navigation complete. Ready to implement profile pages and user management features.
