// Trestle API Test Script
// Load credentials from .env file

require('dotenv').config();
const axios = require('axios');

const TRESTLE_API_ID = process.env.TRESTLE_API_ID;
const TRESTLE_PASSWORD = process.env.TRESTLE_API_PASSWORD;
const TRESTLE_BASE_URL = process.env.TRESTLE_BASE_URL || 'https://api-prod.corelogic.com/trestle';

// Validate environment variables
if (!TRESTLE_API_ID || !TRESTLE_PASSWORD) {
  console.error('❌ Missing required environment variables!');
  console.error('Please make sure TRESTLE_API_ID and TRESTLE_API_PASSWORD are set in your .env file');
  process.exit(1);
}

// Test 1: Basic Authentication Test
async function testAuthentication() {
  console.log('🔐 Testing Trestle API Authentication...');
  
  try {
    const response = await axios.get(`${TRESTLE_BASE_URL}/odata/Property`, {
      auth: {
        username: TRESTLE_API_ID,
        password: TRESTLE_PASSWORD
      },
      params: {
        '$top': 1, // Just get 1 record to test
        '$select': 'ListingKey,ListPrice,UnparsedAddress'
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Authentication successful!');
    console.log('📊 Sample data received:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Test 2: Get Property Count
async function testPropertyCount() {
  console.log('\n📈 Testing Property Count...');
  
  try {
    const response = await axios.get(`${TRESTLE_BASE_URL}/odata/Property/$count`, {
      auth: {
        username: TRESTLE_API_ID,
        password: TRESTLE_PASSWORD
      }
    });
    
    console.log('✅ Total properties available:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Failed to get property count:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Test Specific Filters
async function testFilters() {
  console.log('\n🔍 Testing Property Filters...');
  
  try {
    const response = await axios.get(`${TRESTLE_BASE_URL}/odata/Property`, {
      auth: {
        username: TRESTLE_API_ID,
        password: TRESTLE_PASSWORD
      },
      params: {
        '$top': 5,
        '$filter': "StandardStatus eq 'Active'",
        '$select': 'ListingKey,ListPrice,UnparsedAddress,StandardStatus,PropertyType'
      },
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Filter test successful!');
    console.log('📋 Active properties sample:', JSON.stringify(response.data.value.slice(0, 3), null, 2));
    return true;
  } catch (error) {
    console.error('❌ Filter test failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Test Rate Limits
async function testRateLimit() {
  console.log('\n⏱️ Testing Rate Limits...');
  
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  
  // Make 5 quick requests to test rate limiting
  const promises = Array.from({ length: 5 }, async (_, i) => {
    try {
      await axios.get(`${TRESTLE_BASE_URL}/odata/Property`, {
        auth: {
          username: TRESTLE_API_ID,
          password: TRESTLE_PASSWORD
        },
        params: { '$top': 1 }
      });
      successCount++;
      console.log(`  Request ${i + 1}: ✅`);
    } catch (error) {
      errorCount++;
      console.log(`  Request ${i + 1}: ❌ ${error.response?.status || error.message}`);
    }
  });
  
  await Promise.all(promises);
  const endTime = Date.now();
  
  console.log(`📊 Rate limit test completed in ${endTime - startTime}ms`);
  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`❌ Failed requests: ${errorCount}`);
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Trestle API Tests\n');
  console.log('API ID:', TRESTLE_API_ID);
  console.log('Base URL:', TRESTLE_BASE_URL);
  console.log('Password:', TRESTLE_PASSWORD ? '***HIDDEN***' : '❌ NOT SET');
  console.log('='.repeat(50));
  
  if (!TRESTLE_PASSWORD || TRESTLE_PASSWORD === 'YOUR_PASSWORD') {
    console.error('❌ Please set your actual Trestle API password in the script!');
    return;
  }
  
  const authResult = await testAuthentication();
  if (!authResult) {
    console.log('\n🛑 Authentication failed. Please check your credentials.');
    return;
  }
  
  await testPropertyCount();
  await testFilters();
  await testRateLimit();
  
  console.log('\n🎉 All tests completed!');
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAuthentication,
  testPropertyCount,
  testFilters,
  testRateLimit
}; 