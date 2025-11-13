// Test database connection in localhost
// Run this with: node test-db-connection.js

require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  console.log('\n🔍 Testing Database Connection...\n');
  
  // Check environment
  const isLocalDev = process.env.NODE_ENV === 'development' || process.env.VERCEL !== '1';
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    isLocalDev
  });
  
  // Check which connection method will be used
  if (isLocalDev && process.env.DATABASE_URL) {
    console.log('\n✅ Will use DATABASE_URL (direct connection)\n');
    console.log('DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
  } else if (process.env.INSTANCE_CONNECTION_NAME) {
    console.log('\n☁️ Will use Cloud SQL Connector (OIDC required)\n');
    console.log('INSTANCE_CONNECTION_NAME:', process.env.INSTANCE_CONNECTION_NAME);
  } else {
    console.log('\n❌ No database configuration found!\n');
    process.exit(1);
  }
  
  // Test connection
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Connecting to database...');
    const result = await pool.query('SELECT NOW() as now, current_database() as db');
    
    console.log('\n✅ Connection successful!\n');
    console.log('Server time:', result.rows[0].now);
    console.log('Database:', result.rows[0].db);
    
    // Test properties table
    const countResult = await pool.query('SELECT COUNT(*) as count FROM properties LIMIT 1');
    console.log('\nProperties in database:', countResult.rows[0].count);
    
    await pool.end();
    console.log('\n✅ Test completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
