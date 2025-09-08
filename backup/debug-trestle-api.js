// Enhanced Trestle API Debug Script
// Load credentials from .env file

require('dotenv').config();
const axios = require('axios');

const TRESTLE_API_ID = process.env.TRESTLE_API_ID;
const TRESTLE_PASSWORD = process.env.TRESTLE_API_PASSWORD;

// Validate environment variables
if (!TRESTLE_API_ID || !TRESTLE_PASSWORD) {
  console.error('❌ Missing required environment variables!');
  console.error('Please make sure TRESTLE_API_ID and TRESTLE_API_PASSWORD are set in your .env file');
  process.exit(1);
}

// Try different base URLs
const BASE_URLS = [
    'https://api-prod.corelogic.com/trestle',
    'https://api.corelogic.com/trestle',
    'https://trestle.corelogic.com',
    'https://api-prod.corelogic.com/trestle/v1',
    'https://api.trestle.com'
];

// Different endpoint patterns to try
const ENDPOINTS = [
    '/odata/Property',
    '/Property',
    '/api/Property',
    '/v1/Property',
    '/odata/Properties',
    '/Properties'
];

console.log('🚀 Enhanced Trestle API Debug Script');
console.log('API ID:', TRESTLE_API_ID);
console.log('Password Length:', TRESTLE_PASSWORD.length);
console.log('========================================\n');

// Test different authentication methods
async function testDifferentAuthMethods(baseUrl, endpoint) {
    console.log(`\n🔍 Testing: ${baseUrl}${endpoint}`);
    
    // Method 1: Basic Auth with axios auth object
    try {
        console.log('  Method 1: Axios auth object...');
        const response1 = await axios.get(`${baseUrl}${endpoint}`, {
            auth: {
                username: TRESTLE_API_ID,
                password: TRESTLE_PASSWORD
            },
            params: { '$top': 1 },
            headers: { 'Accept': 'application/json' },
            timeout: 10000
        });
        console.log('  ✅ Method 1 SUCCESS!');
        return { method: 'axios-auth', data: response1.data };
    } catch (error) {
        console.log(`  ❌ Method 1 failed: ${error.response?.status || error.message}`);
    }

    // Method 2: Manual Authorization header
    try {
        console.log('  Method 2: Manual Authorization header...');
        const credentials = Buffer.from(`${TRESTLE_API_ID}:${TRESTLE_PASSWORD}`).toString('base64');
        const response2 = await axios.get(`${baseUrl}${endpoint}`, {
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            params: { '$top': 1 },
            timeout: 10000
        });
        console.log('  ✅ Method 2 SUCCESS!');
        return { method: 'manual-header', data: response2.data };
    } catch (error) {
        console.log(`  ❌ Method 2 failed: ${error.response?.status || error.message}`);
    }

    // Method 3: Try with API key in header
    try {
        console.log('  Method 3: API key in header...');
        const response3 = await axios.get(`${baseUrl}${endpoint}`, {
            headers: {
                'X-API-Key': TRESTLE_API_ID,
                'X-API-Secret': TRESTLE_PASSWORD,
                'Accept': 'application/json'
            },
            params: { '$top': 1 },
            timeout: 10000
        });
        console.log('  ✅ Method 3 SUCCESS!');
        return { method: 'api-key-header', data: response3.data };
    } catch (error) {
        console.log(`  ❌ Method 3 failed: ${error.response?.status || error.message}`);
    }

    // Method 4: Try with Bearer token
    try {
        console.log('  Method 4: Bearer token...');
        const response4 = await axios.get(`${baseUrl}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${TRESTLE_PASSWORD}`,
                'Accept': 'application/json'
            },
            params: { '$top': 1 },
            timeout: 10000
        });
        console.log('  ✅ Method 4 SUCCESS!');
        return { method: 'bearer-token', data: response4.data };
    } catch (error) {
        console.log(`  ❌ Method 4 failed: ${error.response?.status || error.message}`);
    }

    return null;
}

// Test simple connectivity first
async function testConnectivity() {
    console.log('🌐 Testing basic connectivity to endpoints...\n');
    
    for (const baseUrl of BASE_URLS) {
        try {
            console.log(`Testing: ${baseUrl}`);
            const response = await axios.get(baseUrl, { 
                timeout: 5000,
                validateStatus: () => true  // Accept any status code
            });
            console.log(`  Status: ${response.status} - ${response.statusText}`);
            
            // Check if it's a proper API endpoint
            if (response.status === 401) {
                console.log('  🔑 Requires authentication (good sign!)');
            } else if (response.status === 200) {
                console.log('  ✅ Accessible without auth');
            }
            
        } catch (error) {
            if (error.code === 'ENOTFOUND') {
                console.log('  ❌ Domain not found');
            } else if (error.code === 'ECONNREFUSED') {
                console.log('  ❌ Connection refused');
            } else {
                console.log(`  ❌ Error: ${error.message}`);
            }
        }
    }
}

// Test specific Trestle documentation endpoints
async function testKnownEndpoints() {
    console.log('\n📚 Testing known Trestle endpoints...\n');
    
    const trestleBaseUrl = 'https://api-prod.corelogic.com/trestle';
    const knownEndpoints = [
        '/odata/$metadata',
        '/odata/Property/$count',
        '/odata/Property?$top=1',
        '/odata/Member',
        '/odata/Office',
        '/health',
        '/status'
    ];

    for (const endpoint of knownEndpoints) {
        try {
            console.log(`Testing: ${endpoint}`);
            const credentials = Buffer.from(`${TRESTLE_API_ID}:${TRESTLE_PASSWORD}`).toString('base64');
            const response = await axios.get(`${trestleBaseUrl}${endpoint}`, {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Accept': 'application/json'
                },
                timeout: 10000,
                validateStatus: () => true
            });
            
            console.log(`  Status: ${response.status} - ${response.statusText}`);
            if (response.status === 200) {
                console.log('  ✅ SUCCESS!');
                if (typeof response.data === 'object') {
                    console.log('  Data sample:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
                } else {
                    console.log('  Data:', response.data.toString().substring(0, 100) + '...');
                }
            } else if (response.status === 401) {
                console.log('  🔑 Authentication required');
            } else {
                console.log('  ❓ Unexpected status');
            }
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
    }
}

// Main debug function
async function runDebugTests() {
    console.log('Starting comprehensive Trestle API debugging...\n');
    
    // Test 1: Basic connectivity
    await testConnectivity();
    
    // Test 2: Known endpoints
    await testKnownEndpoints();
    
    // Test 3: Try different combinations
    console.log('\n🔄 Testing different URL/endpoint combinations...\n');
    
    let successCount = 0;
    for (const baseUrl of BASE_URLS.slice(0, 3)) { // Test first 3 URLs
        for (const endpoint of ENDPOINTS.slice(0, 3)) { // Test first 3 endpoints
            const result = await testDifferentAuthMethods(baseUrl, endpoint);
            if (result) {
                console.log(`🎉 SUCCESS FOUND!`);
                console.log(`  URL: ${baseUrl}${endpoint}`);
                console.log(`  Method: ${result.method}`);
                console.log(`  Sample data:`, JSON.stringify(result.data, null, 2).substring(0, 300) + '...');
                successCount++;
                break; // Found working combination
            }
        }
        if (successCount > 0) break;
    }
    
    console.log('\n' + '='.repeat(50));
    if (successCount === 0) {
        console.log('❌ No working combinations found.');
        console.log('\n💡 Troubleshooting suggestions:');
        console.log('1. Verify your API credentials with CoreLogic/Trestle support');
        console.log('2. Check if your API subscription is active');
        console.log('3. Confirm the correct base URL for your account');
        console.log('4. Check if your IP needs to be whitelisted');
        console.log('5. Verify the API ID format is correct');
    } else {
        console.log('✅ Found working API configuration!');
    }
}

// Run the debug tests
runDebugTests().catch(console.error); 