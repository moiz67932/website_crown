// Quick test to verify Supabase connection and check for properties table
require('dotenv').config();
const { Pool } = require('pg');

async function testSupabase() {
  console.log('\n🔍 Testing Supabase Connection...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Test basic connection
    console.log('1. Testing connection...');
    const result = await pool.query('SELECT NOW() as now, current_database() as db, current_user as user');
    console.log('✅ Connected successfully!');
    console.log('   Database:', result.rows[0].db);
    console.log('   User:', result.rows[0].user);
    console.log('   Server time:', result.rows[0].now);
    
    // Check for properties table
    console.log('\n2. Checking for properties table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'properties'
      ) as exists;
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Properties table exists!');
      
      // Get count
      const countResult = await pool.query('SELECT COUNT(*) as count FROM properties');
      console.log('   Total properties:', countResult.rows[0].count);
      
      // Get sample
      const sampleResult = await pool.query('SELECT listing_key, city, state, list_price FROM properties LIMIT 3');
      console.log('\n   Sample properties:');
      sampleResult.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.listing_key} - ${row.city}, ${row.state} - $${row.list_price}`);
      });
    } else {
      console.log('❌ Properties table does NOT exist!');
      console.log('   You need to create the properties table in Supabase first.');
    }
    
    await pool.end();
    console.log('\n✅ Test completed!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nDetails:', error);
    await pool.end();
    process.exit(1);
  }
}

testSupabase();
