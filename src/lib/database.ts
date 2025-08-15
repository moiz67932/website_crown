import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Create database instance
const dbPath = join(dataDir, 'users.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// User interface
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
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

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  preferences?: object;
  notification_settings?: object;
}

export interface LoginData {
  email: string;
  password: string;
}

// Saved Properties interfaces
export interface SavedProperty {
  id: number;
  user_id: number;
  property_id: string;
  listing_key: string;
  property_data: string; // JSON string
  notes?: string;
  tags?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// Saved Searches interfaces
export interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  search_criteria: string; // JSON string
  alert_frequency: string;
  is_active: boolean;
  last_alert_sent?: string;
  results_count: number;
  created_at: string;
  updated_at: string;
}

// Search History interfaces
export interface SearchHistory {
  id: number;
  user_id: number;
  search_query: string;
  search_filters?: string; // JSON string
  results_count: number;
  search_timestamp: string;
}

// Viewed Properties interfaces
export interface ViewedProperty {
  id: number;
  user_id: number;
  property_id: string;
  listing_key: string;
  property_data: string; // JSON string
  view_duration: number;
  viewed_at: string;
}

// Property Alerts interfaces
export interface PropertyAlert {
  id: number;
  user_id: number;
  saved_search_id: number;
  property_id: string;
  listing_key: string;
  alert_type: string;
  property_data: string; // JSON string
  is_read: boolean;
  created_at: string;
}

// Initialize database tables
export function initializeDatabase() {
  try {
    // Create users table with the correct schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        phone TEXT,
        bio TEXT,
        avatar_url TEXT,
        is_email_verified BOOLEAN DEFAULT FALSE,
        preferences JSON DEFAULT '{}',
        notification_settings JSON DEFAULT '{"email_alerts": true, "push_notifications": true}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      )
    `);

    // Create saved properties table
    db.exec(`
      CREATE TABLE IF NOT EXISTS saved_properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        property_id TEXT NOT NULL,
        listing_key TEXT NOT NULL,
        property_data JSON NOT NULL,
        notes TEXT,
        tags TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, listing_key)
      )
    `);

    // Create saved searches table
    db.exec(`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        search_criteria JSON NOT NULL,
        alert_frequency TEXT DEFAULT 'daily',
        is_active BOOLEAN DEFAULT TRUE,
        last_alert_sent DATETIME,
        results_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create search history table
    db.exec(`
      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        search_query TEXT NOT NULL,
        search_filters JSON,
        results_count INTEGER DEFAULT 0,
        search_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create viewed properties table
    db.exec(`
      CREATE TABLE IF NOT EXISTS viewed_properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        property_id TEXT NOT NULL,
        listing_key TEXT NOT NULL,
        property_data JSON NOT NULL,
        view_duration INTEGER DEFAULT 0,
        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create property alerts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS property_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        saved_search_id INTEGER NOT NULL,
        property_id TEXT NOT NULL,
        listing_key TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        property_data JSON NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (saved_search_id) REFERENCES saved_searches(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
      CREATE INDEX IF NOT EXISTS idx_saved_properties_listing_key ON saved_properties(listing_key);
      CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
      CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_viewed_properties_user_id ON viewed_properties(user_id);
      CREATE INDEX IF NOT EXISTS idx_viewed_properties_listing_key ON viewed_properties(listing_key);
      CREATE INDEX IF NOT EXISTS idx_property_alerts_user_id ON property_alerts(user_id);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize database first
initializeDatabase();

// Database operations - created after table initialization
function createDatabaseOperations() {
  // Check if the new columns exist in the users table
  let createUserQuery;
  try {
    const tableInfo = db.pragma('table_info(users)') as Array<{name: string}>;
    const columnNames = tableInfo.map((col) => col.name);
    const hasNewColumns = columnNames.includes('preferences') && columnNames.includes('notification_settings');
    
    if (hasNewColumns) {
      // New schema with preferences and notification_settings
      createUserQuery = db.prepare(`
        INSERT INTO users (first_name, last_name, email, password, date_of_birth, preferences, notification_settings)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
    } else {
      // Old schema without new columns
      createUserQuery = db.prepare(`
        INSERT INTO users (first_name, last_name, email, password, date_of_birth)
        VALUES (?, ?, ?, ?, ?)
      `);
    }
  } catch (error) {
    // Fallback to old schema
    createUserQuery = db.prepare(`
      INSERT INTO users (first_name, last_name, email, password, date_of_birth)
      VALUES (?, ?, ?, ?, ?)
    `);
  }

  return {
    // User operations
    createUser: createUserQuery,

    findUserByEmail: db.prepare(`
      SELECT * FROM users WHERE email = ?
    `),

    findUserById: db.prepare(`
      SELECT * FROM users WHERE id = ?
    `),

    updateUserLastLogin: (() => {
      try {
        const tableInfo = db.pragma('table_info(users)') as Array<{name: string}>;
        const hasLastLoginColumn = tableInfo.some(col => col.name === 'last_login_at');
        
        if (hasLastLoginColumn) {
          return db.prepare(`
            UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `);
        } else {
          // Fallback query without last_login_at column
          return db.prepare(`
            UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `);
        }
      } catch (error) {
        // Fallback query without last_login_at column
        return db.prepare(`
          UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `);
      }
    })(),

    updateUserProfile: db.prepare(`
      UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        preferences = COALESCE(?, preferences),
        notification_settings = COALESCE(?, notification_settings),
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `),

    getAllUsers: db.prepare(`
      SELECT id, first_name, last_name, email, date_of_birth, created_at, updated_at FROM users
    `),

    // Saved Properties operations
    saveProperty: db.prepare(`
      INSERT OR REPLACE INTO saved_properties 
      (user_id, property_id, listing_key, property_data, notes, tags, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),

    getUserSavedProperties: db.prepare(`
      SELECT * FROM saved_properties WHERE user_id = ? ORDER BY created_at DESC
    `),

    getUserFavoriteProperties: db.prepare(`
      SELECT * FROM saved_properties WHERE user_id = ? AND is_favorite = 1 ORDER BY created_at DESC
    `),

    removeSavedProperty: db.prepare(`
      DELETE FROM saved_properties WHERE user_id = ? AND listing_key = ?
    `),

    updatePropertyNotes: db.prepare(`
      UPDATE saved_properties SET notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND listing_key = ?
    `),

    togglePropertyFavorite: db.prepare(`
      UPDATE saved_properties SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND listing_key = ?
    `),

    checkIfPropertySaved: db.prepare(`
      SELECT * FROM saved_properties WHERE user_id = ? AND listing_key = ?
    `),

    // Saved Searches operations
    saveSearch: db.prepare(`
      INSERT INTO saved_searches (user_id, name, search_criteria, alert_frequency)
      VALUES (?, ?, ?, ?)
    `),

    getUserSavedSearches: db.prepare(`
      SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC
    `),

    updateSavedSearch: db.prepare(`
      UPDATE saved_searches SET 
        name = ?, search_criteria = ?, alert_frequency = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `),

    deleteSavedSearch: db.prepare(`
      DELETE FROM saved_searches WHERE id = ? AND user_id = ?
    `),

    updateSearchLastAlert: db.prepare(`
      UPDATE saved_searches SET last_alert_sent = CURRENT_TIMESTAMP WHERE id = ?
    `),

    // Search History operations
    addSearchHistory: db.prepare(`
      INSERT INTO search_history (user_id, search_query, search_filters, results_count)
      VALUES (?, ?, ?, ?)
    `),

    getUserSearchHistory: db.prepare(`
      SELECT * FROM search_history WHERE user_id = ? ORDER BY search_timestamp DESC LIMIT ?
    `),

    clearUserSearchHistory: db.prepare(`
      DELETE FROM search_history WHERE user_id = ?
    `),

    // Viewed Properties operations
    addViewedProperty: db.prepare(`
      INSERT OR REPLACE INTO viewed_properties 
      (user_id, property_id, listing_key, property_data, view_duration)
      VALUES (?, ?, ?, ?, ?)
    `),

    getUserViewedProperties: db.prepare(`
      SELECT * FROM viewed_properties WHERE user_id = ? ORDER BY viewed_at DESC LIMIT ?
    `),

    clearUserViewedProperties: db.prepare(`
      DELETE FROM viewed_properties WHERE user_id = ?
    `),

    // Property Alerts operations
    createPropertyAlert: db.prepare(`
      INSERT INTO property_alerts 
      (user_id, saved_search_id, property_id, listing_key, alert_type, property_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `),

    getUserPropertyAlerts: db.prepare(`
      SELECT * FROM property_alerts WHERE user_id = ? ORDER BY created_at DESC
    `),

    markAlertAsRead: db.prepare(`
      UPDATE property_alerts SET is_read = 1 WHERE id = ? AND user_id = ?
    `),

    deletePropertyAlert: db.prepare(`
      DELETE FROM property_alerts WHERE id = ? AND user_id = ?
    `),

    getUnreadAlertsCount: db.prepare(`
      SELECT COUNT(*) as count FROM property_alerts WHERE user_id = ? AND is_read = 0
    `),
  };
}

export const userDb = createDatabaseOperations();

// User service functions
export class UserService {
  static async createUser(userData: CreateUserData): Promise<{ success: boolean; message: string; userId?: number }> {
    try {
      // Check if user already exists
      const existingUser = userDb.findUserByEmail.get(userData.email) as User | undefined;
      if (existingUser) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Check if database supports new columns
      let result;
      try {
        const tableInfo = db.pragma('table_info(users)') as Array<{name: string}>;
        const columnNames = tableInfo.map((col) => col.name);
        const hasNewColumns = columnNames.includes('preferences') && columnNames.includes('notification_settings');
        
        if (hasNewColumns) {
          // Insert user with default preferences and notification settings
          const defaultPreferences = JSON.stringify({
            currency: 'USD',
            units: 'imperial',
            theme: 'light'
          });
          
          const defaultNotificationSettings = JSON.stringify({
            email_alerts: true,
            push_notifications: true,
            weekly_digest: true,
            marketing_emails: false
          });

          result = userDb.createUser.run(
            userData.firstName,
            userData.lastName,
            userData.email,
            hashedPassword,
            userData.dateOfBirth,
            defaultPreferences,
            defaultNotificationSettings
          );
        } else {
          // Insert user with old schema
          result = userDb.createUser.run(
            userData.firstName,
            userData.lastName,
            userData.email,
            hashedPassword,
            userData.dateOfBirth
          );
        }
      } catch (error) {
        // Fallback to old schema
        result = userDb.createUser.run(
          userData.firstName,
          userData.lastName,
          userData.email,
          hashedPassword,
          userData.dateOfBirth
        );
      }

      return { 
        success: true, 
        message: 'User created successfully', 
        userId: result.lastInsertRowid as number 
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  static async loginUser(loginData: LoginData): Promise<{ success: boolean; message: string; user?: Omit<User, 'password'> }> {
    try {
      // Find user by email
      const user = userDb.findUserByEmail.get(loginData.email) as User | undefined;
      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Update last login
      userDb.updateUserLastLogin.run(user.id);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return { 
        success: true, 
        message: 'Login successful', 
        user: userWithoutPassword 
      };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  static getUserById(id: number): Omit<User, 'password'> | undefined {
    try {
      const user = userDb.findUserById.get(id) as User | undefined;
      if (!user) return undefined;

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  static getUserByEmail(email: string): Omit<User, 'password'> | undefined {
    try {
      const user = userDb.findUserByEmail.get(email) as User | undefined;
      if (!user) return undefined;

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  static async updateUserProfile(userId: number, updateData: UpdateUserData): Promise<{ success: boolean; message: string }> {
    try {
      const preferencesJson = updateData.preferences ? JSON.stringify(updateData.preferences) : null;
      const notificationSettingsJson = updateData.notification_settings ? JSON.stringify(updateData.notification_settings) : null;

      userDb.updateUserProfile.run(
        updateData.firstName || null,
        updateData.lastName || null,
        updateData.phone || null,
        updateData.bio || null,
        updateData.avatar_url || null,
        preferencesJson,
        notificationSettingsJson,
        userId
      );

      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  }
}

// Saved Properties Service
export class SavedPropertiesService {
  static saveProperty(userId: number, property: any, isFavorite: boolean = false, notes?: string, tags?: string): { success: boolean; message: string } {
    try {
      userDb.saveProperty.run(
        userId,
        property.id || property._id,
        property.listing_key,
        JSON.stringify(property),
        notes || null,
        tags || null,
        isFavorite ? 1 : 0
      );
      return { success: true, message: 'Property saved successfully' };
    } catch (error) {
      console.error('Error saving property:', error);
      return { success: false, message: 'Failed to save property' };
    }
  }

  static getUserSavedProperties(userId: number): SavedProperty[] {
    try {
      return userDb.getUserSavedProperties.all(userId) as SavedProperty[];
    } catch (error) {
      console.error('Error getting saved properties:', error);
      return [];
    }
  }

  static getUserFavoriteProperties(userId: number): SavedProperty[] {
    try {
      return userDb.getUserFavoriteProperties.all(userId) as SavedProperty[];
    } catch (error) {
      console.error('Error getting favorite properties:', error);
      return [];
    }
  }

  static removeSavedProperty(userId: number, listingKey: string): { success: boolean; message: string } {
    try {
      userDb.removeSavedProperty.run(userId, listingKey);
      return { success: true, message: 'Property removed successfully' };
    } catch (error) {
      console.error('Error removing saved property:', error);
      return { success: false, message: 'Failed to remove property' };
    }
  }

  static updatePropertyNotes(userId: number, listingKey: string, notes: string): { success: boolean; message: string } {
    try {
      userDb.updatePropertyNotes.run(notes, userId, listingKey);
      return { success: true, message: 'Notes updated successfully' };
    } catch (error) {
      console.error('Error updating property notes:', error);
      return { success: false, message: 'Failed to update notes' };
    }
  }

  static togglePropertyFavorite(userId: number, listingKey: string, isFavorite: boolean): { success: boolean; message: string } {
    try {
      userDb.togglePropertyFavorite.run(isFavorite ? 1 : 0, userId, listingKey);
      return { success: true, message: 'Favorite status updated successfully' };
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return { success: false, message: 'Failed to update favorite status' };
    }
  }

  static isPropertySaved(userId: number, listingKey: string): boolean {
    try {
      const result = userDb.checkIfPropertySaved.get(userId, listingKey);
      return !!result;
    } catch (error) {
      console.error('Error checking if property is saved:', error);
      return false;
    }
  }
}

// Saved Searches Service
export class SavedSearchesService {
  static saveSearch(userId: number, name: string, searchCriteria: object, alertFrequency: string = 'daily'): { success: boolean; message: string; searchId?: number } {
    try {
      const result = userDb.saveSearch.run(userId, name, JSON.stringify(searchCriteria), alertFrequency);
      return { 
        success: true, 
        message: 'Search saved successfully',
        searchId: result.lastInsertRowid as number
      };
    } catch (error) {
      console.error('Error saving search:', error);
      return { success: false, message: 'Failed to save search' };
    }
  }

  static getUserSavedSearches(userId: number): SavedSearch[] {
    try {
      return userDb.getUserSavedSearches.all(userId) as SavedSearch[];
    } catch (error) {
      console.error('Error getting saved searches:', error);
      return [];
    }
  }

  static updateSavedSearch(userId: number, searchId: number, name: string, searchCriteria: object, alertFrequency: string, isActive: boolean): { success: boolean; message: string } {
    try {
      userDb.updateSavedSearch.run(name, JSON.stringify(searchCriteria), alertFrequency, isActive ? 1 : 0, searchId, userId);
      return { success: true, message: 'Search updated successfully' };
    } catch (error) {
      console.error('Error updating saved search:', error);
      return { success: false, message: 'Failed to update search' };
    }
  }

  static deleteSavedSearch(userId: number, searchId: number): { success: boolean; message: string } {
    try {
      userDb.deleteSavedSearch.run(searchId, userId);
      return { success: true, message: 'Search deleted successfully' };
    } catch (error) {
      console.error('Error deleting saved search:', error);
      return { success: false, message: 'Failed to delete search' };
    }
  }
}

// Search History Service
export class SearchHistoryService {
  static addSearchHistory(userId: number, searchQuery: string, searchFilters?: object, resultsCount: number = 0): { success: boolean; message: string } {
    try {
      userDb.addSearchHistory.run(
        userId, 
        searchQuery, 
        searchFilters ? JSON.stringify(searchFilters) : null, 
        resultsCount
      );
      return { success: true, message: 'Search history added successfully' };
    } catch (error) {
      console.error('Error adding search history:', error);
      return { success: false, message: 'Failed to add search history' };
    }
  }

  static getUserSearchHistory(userId: number, limit: number = 50): SearchHistory[] {
    try {
      return userDb.getUserSearchHistory.all(userId, limit) as SearchHistory[];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  static clearUserSearchHistory(userId: number): { success: boolean; message: string } {
    try {
      userDb.clearUserSearchHistory.run(userId);
      return { success: true, message: 'Search history cleared successfully' };
    } catch (error) {
      console.error('Error clearing search history:', error);
      return { success: false, message: 'Failed to clear search history' };
    }
  }
}

// Viewed Properties Service
export class ViewedPropertiesService {
  static addViewedProperty(userId: number, property: any, viewDuration: number = 0): { success: boolean; message: string } {
    try {
      userDb.addViewedProperty.run(
        userId,
        property.id || property._id,
        property.listing_key,
        JSON.stringify(property),
        viewDuration
      );
      return { success: true, message: 'Viewed property added successfully' };
    } catch (error) {
      console.error('Error adding viewed property:', error);
      return { success: false, message: 'Failed to add viewed property' };
    }
  }

  static getUserViewedProperties(userId: number, limit: number = 50): ViewedProperty[] {
    try {
      return userDb.getUserViewedProperties.all(userId, limit) as ViewedProperty[];
    } catch (error) {
      console.error('Error getting viewed properties:', error);
      return [];
    }
  }

  static clearUserViewedProperties(userId: number): { success: boolean; message: string } {
    try {
      userDb.clearUserViewedProperties.run(userId);
      return { success: true, message: 'Viewed properties cleared successfully' };
    } catch (error) {
      console.error('Error clearing viewed properties:', error);
      return { success: false, message: 'Failed to clear viewed properties' };
    }
  }
}

// Property Alerts Service
export class PropertyAlertsService {
  static createPropertyAlert(userId: number, savedSearchId: number, property: any, alertType: string): { success: boolean; message: string } {
    try {
      userDb.createPropertyAlert.run(
        userId,
        savedSearchId,
        property.id || property._id,
        property.listing_key,
        alertType,
        JSON.stringify(property)
      );
      return { success: true, message: 'Property alert created successfully' };
    } catch (error) {
      console.error('Error creating property alert:', error);
      return { success: false, message: 'Failed to create property alert' };
    }
  }

  static getUserPropertyAlerts(userId: number): PropertyAlert[] {
    try {
      return userDb.getUserPropertyAlerts.all(userId) as PropertyAlert[];
    } catch (error) {
      console.error('Error getting property alerts:', error);
      return [];
    }
  }

  static markAlertAsRead(userId: number, alertId: number): { success: boolean; message: string } {
    try {
      userDb.markAlertAsRead.run(alertId, userId);
      return { success: true, message: 'Alert marked as read' };
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return { success: false, message: 'Failed to mark alert as read' };
    }
  }

  static deletePropertyAlert(userId: number, alertId: number): { success: boolean; message: string } {
    try {
      userDb.deletePropertyAlert.run(alertId, userId);
      return { success: true, message: 'Alert deleted successfully' };
    } catch (error) {
      console.error('Error deleting property alert:', error);
      return { success: false, message: 'Failed to delete alert' };
    }
  }

  static getUnreadAlertsCount(userId: number): number {
    try {
      const result = userDb.getUnreadAlertsCount.get(userId) as { count: number };
      return result.count;
    } catch (error) {
      console.error('Error getting unread alerts count:', error);
      return 0;
    }
  }
}

export default db;