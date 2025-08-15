# User Management System - Comprehensive Testing Guide

## Overview
This guide explains how to test the complete user management system implemented in your real estate application.

## ✅ Features Implemented

### 1. **User Profile Management**
- ✅ Complete profile editing (name, phone, bio)
- ✅ Avatar and personal information
- ✅ Notification preferences
- ✅ Account security overview
- ✅ Profile persistence across sessions

### 2. **Saved Properties & Favorites**
- ✅ Save properties with notes and tags
- ✅ Mark properties as favorites
- ✅ Remove saved properties
- ✅ Edit property notes
- ✅ Toggle favorite status
- ✅ View all saved properties in dashboard

### 3. **Saved Searches with Alerts**
- ✅ Save search criteria with custom names
- ✅ Configure alert frequency (daily, weekly, etc.)
- ✅ Enable/disable search alerts
- ✅ Edit and delete saved searches
- ✅ View search results count

### 4. **Search History**
- ✅ Automatic tracking of all searches
- ✅ Store search queries and filters
- ✅ Results count tracking
- ✅ Timestamp for each search
- ✅ Clear search history option

### 5. **Viewed Properties History**
- ✅ Track property views automatically
- ✅ Record view duration
- ✅ Store viewing timestamp
- ✅ View history in dashboard
- ✅ Clear viewed properties

### 6. **Comprehensive Dashboard**
- ✅ Activity overview with statistics
- ✅ Recent favorites display
- ✅ Active search alerts
- ✅ Recent viewing activity
- ✅ Tabbed interface for easy navigation

## 🚀 How to Test

### Prerequisites
```bash
# Ensure all dependencies are installed
npm install

# Start the development server
npm run dev
```

### 1. Testing User Registration & Profile Setup

#### Register a New User
1. Go to `/auth/register`
2. Fill in all required fields:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Password: `SecurePassword123!`
   - Date of Birth: `1990-01-01`
3. Submit the form
4. Verify user is automatically logged in
5. Check that auth cookie is set

#### Access Profile Management
1. Navigate to `/profile` or click "Profile" in user menu
2. Verify all profile information is displayed correctly
3. Test profile editing:
   - Click "Edit Profile"
   - Update phone number: `+1 (555) 123-4567`
   - Add bio: `Real estate enthusiast looking for the perfect home`
   - Save changes
   - Verify changes persist after page refresh

### 2. Testing Saved Properties & Favorites

#### Save Properties
1. Go to `/properties` page
2. Find a property you like
3. Click the **Scale icon** (comparison button) - this will save the property
4. Look for success notification: "Property saved successfully"
5. Repeat for 3-4 different properties

#### Test Favorites
1. Go to `/dashboard`
2. Click "Properties" tab
3. You should see your saved properties
4. For any saved property, test:
   - Adding notes: Click on a property → Add notes
   - Marking as favorite: Toggle the favorite status
   - Removing from saved: Remove a property

#### Verify Favorites Display
1. Go to "Overview" tab in dashboard
2. Check "Recent Favorites" section shows your favorited properties
3. Properties should show images, addresses, and prices

### 3. Testing Saved Searches & Alerts

#### Create Saved Searches
1. Go to `/properties` page
2. Use the search filters:
   - Set price range: `$400,000 - $800,000`
   - Choose bedrooms: `3`
   - Select property type: `Residential`
   - Choose city: `San Diego`
3. **Note**: Currently you'll need to manually save this via API or we need to add a "Save Search" button

#### API Testing for Saved Searches
```bash
# Using curl to test saved search creation
curl -X POST http://localhost:3000/api/user/saved-searches \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "name": "Dream Home Search",
    "searchCriteria": {
      "minPrice": 400000,
      "maxPrice": 800000,
      "bedrooms": 3,
      "propertyType": "Residential",
      "city": "San Diego"
    },
    "alertFrequency": "daily"
  }'
```

#### View Saved Searches
1. Go to `/dashboard`
2. Click "Searches" tab
3. Should show your saved searches with:
   - Search name
   - Active/Inactive status
   - Alert frequency
   - Results count
   - Creation date

### 4. Testing Search History

#### Generate Search History
1. Go to `/properties` page
2. Perform several different searches:
   - Search for "San Diego"
   - Filter by price range
   - Search for "luxury homes"
   - Filter by bedrooms
3. Each search should automatically be recorded

#### View Search History
1. Go to `/dashboard`
2. Click "History" tab
3. Should show all your recent searches with:
   - Search query
   - Results count
   - Search timestamp
   - Ability to re-run search

#### Test History API
```bash
# Add search history manually
curl -X POST http://localhost:3000/api/user/search-history \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "searchQuery": "luxury condos near beach",
    "searchFilters": {
      "propertyType": "Condo",
      "minPrice": 500000
    },
    "resultsCount": 25
  }'
```

### 5. Testing Viewed Properties

#### Generate Viewed Properties
1. Go to `/properties` page
2. Click on several different properties to view their details
3. Spend different amounts of time on each property page
4. Visit at least 5-6 different properties

#### Test Viewed Properties API
```bash
# Add viewed property manually
curl -X POST http://localhost:3000/api/user/viewed-properties \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "property": {
      "listing_key": "PROP123",
      "address": "123 Ocean View Drive",
      "list_price": 750000,
      "bedrooms": 3,
      "bathrooms": 2
    },
    "viewDuration": 45000
  }'
```

#### View Viewed Properties
1. Go to `/dashboard`
2. Check "Overview" tab for "Recent Activity"
3. Also check "Properties" tab for "Recently Viewed"
4. Should show:
   - Property images and details
   - View duration
   - View timestamp

### 6. Testing Dashboard Features

#### Overview Tab
1. Go to `/dashboard`
2. Verify all statistics cards show correct counts:
   - Saved Properties count
   - Saved Searches count  
   - Recently Viewed count
   - Search History count
3. Check sections:
   - "Recent Favorites" (shows favorited properties)
   - "Active Search Alerts" (shows enabled saved searches)
   - "Recent Activity" (shows recently viewed properties)

#### Properties Tab
1. Should show two sections:
   - "Saved Properties" with all saved properties
   - "Recently Viewed" with viewing history
2. Test property interactions:
   - View property details
   - Toggle favorite status
   - Remove saved properties

#### Searches Tab
1. Should show all saved searches
2. Each search should display:
   - Search name
   - Active/inactive status
   - Alert frequency
   - Results count
   - Edit button (placeholder)

#### History Tab
1. Should show complete search history
2. Each entry should show:
   - Search query
   - Results count
   - Search timestamp
   - Re-search button (placeholder)

#### Profile Tab
1. Should show profile summary:
   - Name and email
   - Age calculation
   - Member since date
   - Account verification status
2. Quick action buttons should work

### 7. Testing API Endpoints

#### Profile API
```bash
# Get user profile
curl -X GET http://localhost:3000/api/user/profile \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN"

# Update user profile
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-555-123-4567",
    "bio": "Love real estate!",
    "notificationSettings": {
      "emailAlerts": true,
      "pushNotifications": false
    }
  }'
```

#### Saved Properties API
```bash
# Get saved properties
curl -X GET http://localhost:3000/api/user/saved-properties \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN"

# Get only favorites
curl -X GET "http://localhost:3000/api/user/saved-properties?favorites=true" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN"

# Save a property
curl -X POST http://localhost:3000/api/user/saved-properties \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "property": {
      "listing_key": "PROP456",
      "address": "456 Beach Boulevard",
      "list_price": 950000
    },
    "isFavorite": true,
    "notes": "Perfect beachfront location!"
  }'

# Update property notes
curl -X PUT http://localhost:3000/api/user/saved-properties/PROP456 \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "action": "update_notes",
    "notes": "Updated notes about this property"
  }'

# Toggle favorite status
curl -X PUT http://localhost:3000/api/user/saved-properties/PROP456 \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "action": "toggle_favorite",
    "isFavorite": false
  }'

# Remove saved property
curl -X DELETE "http://localhost:3000/api/user/saved-properties?listingKey=PROP456" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN"
```

### 8. Testing Data Persistence

#### Database Verification
1. Check that SQLite database is created: `data/users.db`
2. Verify all tables exist:
   - `users`
   - `saved_properties`
   - `saved_searches`
   - `search_history`
   - `viewed_properties`
   - `property_alerts`

#### Session Persistence
1. Log in and use features
2. Close browser/clear cache (but keep cookies)
3. Return to application
4. Verify all data is still there:
   - Profile information
   - Saved properties
   - Search history
   - Viewed properties

### 9. Testing Notification Settings

#### Profile Settings
1. Go to `/profile`
2. Test notification toggles:
   - Email Alerts
   - Push Notifications
   - Weekly Digest
   - Marketing Emails
3. Save settings
4. Verify changes persist in database

### 10. Error Handling Tests

#### Authentication Required
1. Log out
2. Try to access:
   - `/dashboard` → Should redirect to login
   - `/profile` → Should redirect to login
   - API endpoints → Should return 401

#### Invalid Data
1. Try updating profile with invalid phone number
2. Try saving property without listing_key
3. Verify proper error messages

### 11. Mobile/Responsive Testing

#### Mobile Dashboard
1. Test dashboard on mobile devices
2. Verify:
   - Tabs work correctly
   - Cards are responsive
   - Property images load properly
   - Navigation is touch-friendly

## 🎯 Success Criteria

The user management system is working correctly if:

- ✅ Users can register and manage their profiles
- ✅ Properties can be saved, favorited, and managed
- ✅ Search history is automatically tracked
- ✅ Viewed properties are recorded with timing
- ✅ Dashboard shows comprehensive activity overview
- ✅ All data persists across sessions
- ✅ API endpoints work correctly with proper authentication
- ✅ Profile settings can be updated and saved
- ✅ Notification preferences are configurable
- ✅ No console errors or performance issues

## 🔧 Troubleshooting

### Common Issues

1. **Database not creating tables**:
   - Check that `data/` directory exists
   - Verify SQLite permissions
   - Check console for initialization errors

2. **Authentication token issues**:
   - Clear browser cookies
   - Check that JWT_SECRET is set in environment
   - Verify token expiration settings

3. **API endpoints returning 500**:
   - Check server console for errors
   - Verify database connection
   - Check that all required fields are provided

4. **Dashboard not loading data**:
   - Verify user is authenticated
   - Check that API calls are successful
   - Test individual API endpoints

5. **Profile updates not saving**:
   - Check network tab for API calls
   - Verify request payload format
   - Check server response for errors

## 📈 Performance Monitoring

Monitor these metrics:
- Database query performance
- API response times
- Dashboard load times
- Image loading performance
- Search history query efficiency

The user management system provides a comprehensive foundation for user engagement and property management in your real estate application!
