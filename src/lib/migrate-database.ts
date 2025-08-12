import Database from 'better-sqlite3';
import { join } from 'path';

const dataDir = join(process.cwd(), 'data');
const dbPath = join(dataDir, 'users.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Check if the new columns exist
    const tableInfo = db.pragma('table_info(users)') as Array<{name: string}>;
    const columnNames = tableInfo.map((col) => col.name);
    
    const hasNewColumns = [
      'phone',
      'bio', 
      'avatar_url',
      'preferences',
      'notification_settings',
      'last_login_at'
    ].every(col => columnNames.includes(col));
    
    if (!hasNewColumns) {
      console.log('🔧 Adding new columns to users table...');
      
      // Add new columns one by one
      const columnsToAdd = [
        'ALTER TABLE users ADD COLUMN phone TEXT',
        'ALTER TABLE users ADD COLUMN bio TEXT',
        'ALTER TABLE users ADD COLUMN avatar_url TEXT',
        'ALTER TABLE users ADD COLUMN preferences JSON DEFAULT \'{}\'',
        'ALTER TABLE users ADD COLUMN notification_settings JSON DEFAULT \'{"email_alerts": true, "push_notifications": true}\'',
        'ALTER TABLE users ADD COLUMN last_login_at DATETIME'
      ];
      
      columnsToAdd.forEach(sql => {
        try {
          db.exec(sql);
        } catch (error: any) {
          // Column might already exist, that's ok
          if (!error.message.includes('duplicate column name')) {
            console.warn(`Warning: ${error.message}`);
          }
        }
      });
      
      console.log('✅ Users table migration completed');
    } else {
      console.log('✅ Users table already has new columns');
    }
    
    // Create new tables if they don't exist
    const createTablesSql = `
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
      );

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
      );

      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        search_query TEXT NOT NULL,
        search_filters JSON,
        results_count INTEGER DEFAULT 0,
        search_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS viewed_properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        property_id TEXT NOT NULL,
        listing_key TEXT NOT NULL,
        property_data JSON NOT NULL,
        view_duration INTEGER DEFAULT 0,
        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

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
      );
    `;
    
    db.exec(createTablesSql);
    console.log('✅ All new tables created');
    
    // Create indexes
    const indexesSql = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
      CREATE INDEX IF NOT EXISTS idx_saved_properties_listing_key ON saved_properties(listing_key);
      CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
      CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_viewed_properties_user_id ON viewed_properties(user_id);
      CREATE INDEX IF NOT EXISTS idx_viewed_properties_listing_key ON viewed_properties(listing_key);
      CREATE INDEX IF NOT EXISTS idx_property_alerts_user_id ON property_alerts(user_id);
    `;
    
    db.exec(indexesSql);
    console.log('✅ All indexes created');
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    db.close();
  }
}
