// Trestle Bearer Authentication Test
// Load credentials from .env file

require('dotenv').config();
const axios = require('axios');

const TRESTLE_API_ID = process.env.TRESTLE_API_ID;
const TRESTLE_PASSWORD = process.env.TRESTLE_API_PASSWORD;
const BASE_URL = process.env.TRESTLE_BASE_URL || 'https://api-prod.corelogic.com/trestle';

// Validate environment variables
if (!TRESTLE_API_ID || !TRESTLE_PASSWORD) {
  console.error('❌ Missing required environment variables!');
  console.error('Please make sure TRESTLE_API_ID and TRESTLE_API_PASSWORD are set in your .env file');
  process.exit(1);
}

console.log('🔑 Testing Bearer Token Authentication');
console.log('=====================================');
console.log('API response indicated "www-authenticate: Bearer"');
console.log('Testing different Bearer token approaches...\n');

// Test different Bearer token formats
const bearerTests = [
    { token: TRESTLE_PASSWORD, name: 'Password as Bearer token' },
    { token: TRESTLE_API_ID, name: 'API ID as Bearer token' },
    { token: `${TRESTLE_API_ID}:${TRESTLE_PASSWORD}`, name: 'Combined credentials' },
    { token: Buffer.from(`${TRESTLE_API_ID}:${TRESTLE_PASSWORD}`).toString('base64'), name: 'Base64 encoded credentials' },
    { token: `${TRESTLE_API_ID}.${TRESTLE_PASSWORD}`, name: 'Dot-separated credentials' },
    { token: `${TRESTLE_PASSWORD}.${TRESTLE_API_ID}`, name: 'Reversed dot-separated credentials' }
];

async function testBearerAuth(token, description) {
    try {
        console.log(`Testing: ${description}`);
        console.log(`  Token: ${token.substring(0, 20)}...`);
        
        const response = await axios.get(`${BASE_URL}/odata/Property`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            params: { '$top': 1 },
            timeout: 10000
        });
        
        console.log('  ✅ SUCCESS!');
        console.log('  Status:', response.status);
        console.log('  Sample data:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
        return true;
        
    } catch (error) {
        const status = error.response?.status || 'No status';
        const statusText = error.response?.statusText || error.message;
        console.log(`  ❌ Failed: ${status} - ${statusText}`);
        
        if (error.response?.data && Object.keys(error.response.data).length > 1) {
            console.log('  Error details:', JSON.stringify(error.response.data, null, 2));
        }
        
        return false;
    }
}

// Test OAuth-style token request
async function testOAuthTokenRequest() {
    console.log('\n🔄 Testing OAuth Token Request...');
    console.log('Attempting to get access token first...\n');
    
    const authEndpoints = [
        '/oauth/token',
        '/auth/token',
        '/token',
        '/api/auth/token',
        '/api/oauth/token'
    ];
    
    for (const endpoint of authEndpoints) {
        try {
            console.log(`Trying: ${BASE_URL}${endpoint}`);
            
            // Try different OAuth grant types
            const grantTypes = [
                { grant_type: 'client_credentials', client_id: TRESTLE_API_ID, client_secret: TRESTLE_PASSWORD },
                { grant_type: 'password', username: TRESTLE_API_ID, password: TRESTLE_PASSWORD },
                { username: TRESTLE_API_ID, password: TRESTLE_PASSWORD }
            ];
            
            for (const payload of grantTypes) {
                try {
                    const response = await axios.post(`${BASE_URL}${endpoint}`, payload, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json'
                        },
                        timeout: 10000
                    });
                    
                    console.log('  ✅ Token endpoint found!');
                    console.log('  Response:', JSON.stringify(response.data, null, 2));
                    
                    if (response.data.access_token) {
                        console.log('\n🎯 Testing with received access token...');
                        const success = await testBearerAuth(response.data.access_token, 'OAuth access token');
                        if (success) return true;
                    }
                    
                } catch (error) {
                    // Continue trying other combinations
                }
            }
            
        } catch (error) {
            console.log(`  ❌ ${endpoint}: ${error.response?.status || error.message}`);
        }
    }
    
    return false;
}

// Test API key authentication methods
async function testAPIKeyMethods() {
    console.log('\n🔐 Testing API Key Methods...');
    
    const apiKeyTests = [
        { headers: { 'X-API-Key': TRESTLE_API_ID, 'X-API-Secret': TRESTLE_PASSWORD }, name: 'X-API-Key + X-API-Secret' },
        { headers: { 'apikey': TRESTLE_API_ID, 'secret': TRESTLE_PASSWORD }, name: 'apikey + secret' },
        { headers: { 'X-Auth-Token': TRESTLE_PASSWORD }, name: 'X-Auth-Token' },
        { headers: { 'X-Client-Id': TRESTLE_API_ID, 'X-Client-Secret': TRESTLE_PASSWORD }, name: 'Client ID/Secret' },
        { params: { 'api_key': TRESTLE_API_ID, 'api_secret': TRESTLE_PASSWORD }, name: 'URL parameters' }
    ];
    
    for (const test of apiKeyTests) {
        try {
            console.log(`Testing: ${test.name}`);
            
            const config = {
                headers: {
                    'Accept': 'application/json',
                    ...test.headers
                },
                timeout: 10000
            };
            
            if (test.params) {
                config.params = { '$top': 1, ...test.params };
            } else {
                config.params = { '$top': 1 };
            }
            
            const response = await axios.get(`${BASE_URL}/odata/Property`, config);
            
            console.log('  ✅ SUCCESS!');
            console.log('  Status:', response.status);
            return true;
            
        } catch (error) {
            console.log(`  ❌ Failed: ${error.response?.status || error.message}`);
        }
    }
    
    return false;
}

// Main test runner
async function runAllBearerTests() {
    let successCount = 0;
    
    // Test 1: Bearer token variations
    for (const test of bearerTests) {
        const success = await testBearerAuth(test.token, test.name);
        if (success) {
            successCount++;
            console.log(`\n🎉 WORKING BEARER TOKEN FOUND!`);
            console.log(`   Token: ${test.token}`);
            break;
        }
        console.log('');
    }
    
    // Test 2: OAuth token flow
    if (successCount === 0) {
        const oauthSuccess = await testOAuthTokenRequest();
        if (oauthSuccess) successCount++;
    }
    
    // Test 3: API key methods
    if (successCount === 0) {
        const apiKeySuccess = await testAPIKeyMethods();
        if (apiKeySuccess) successCount++;
    }
    
    if (successCount === 0) {
        console.log('\n❌ No authentication method worked.');
        console.log('\n🆘 FINAL RECOMMENDATION:');
        console.log('Since the API is responding but rejecting all authentication methods,');
        console.log('you should contact CoreLogic/Trestle support with this information:');
        console.log('');
        console.log('1. Your API ID: ');
        console.log('2. Your password length: 32 characters (hexadecimal)');
        console.log('3. Base URL: https://api-prod.corelogic.com/trestle');
        console.log('4. Error: All authentication methods return 401 Unauthorized');
        console.log('5. API response headers indicate Bearer authentication');
        console.log('6. Ask them for a working example of authentication');
        console.log('');
        console.log('📧 Contact: Trestle API Support');
        console.log('🌐 Documentation: Check Trestle developer portal for auth examples');
    }
}

runAllBearerTests().catch(console.error); 