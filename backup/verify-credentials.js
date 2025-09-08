// Trestle Credential Verification Script
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

console.log('🔍 Trestle Credential Verification');
console.log('================================');
console.log('API ID:', TRESTLE_API_ID);
console.log('API ID Length:', TRESTLE_API_ID.length);
console.log('Password Length:', TRESTLE_PASSWORD.length);
console.log('Password Format:', /^[a-f0-9]+$/.test(TRESTLE_PASSWORD) ? 'Hexadecimal' : 'Mixed characters');

// Create the base64 encoded credentials manually to verify
const credentials = Buffer.from(`${TRESTLE_API_ID}:${TRESTLE_PASSWORD}`).toString('base64');
console.log('Base64 Credentials Length:', credentials.length);
console.log('Base64 Sample:', credentials.substring(0, 20) + '...');

console.log('\n🧪 Testing credential format variations...\n');

// Test different credential combinations
const testCombinations = [
    { id: TRESTLE_API_ID, pass: TRESTLE_PASSWORD, name: 'Original credentials' },
    { id: TRESTLE_PASSWORD, pass: TRESTLE_API_ID, name: 'Swapped ID/Password' },
    { id: TRESTLE_API_ID.toLowerCase(), pass: TRESTLE_PASSWORD, name: 'Lowercase API ID' },
    { id: TRESTLE_API_ID.toUpperCase(), pass: TRESTLE_PASSWORD, name: 'Uppercase API ID' },
    { id: TRESTLE_API_ID, pass: TRESTLE_PASSWORD.toLowerCase(), name: 'Lowercase Password' },
    { id: TRESTLE_API_ID, pass: TRESTLE_PASSWORD.toUpperCase(), name: 'Uppercase Password' }
];

async function testCredentials(apiId, password, description) {
    try {
        console.log(`Testing: ${description}`);
        console.log(`  ID: ${apiId}`);
        console.log(`  Pass: ${password.substring(0, 8)}...`);
        
        const response = await axios.get(`${BASE_URL}/odata/Property`, {
            auth: {
                username: apiId,
                password: password
            },
            params: { '$top': 1 },
            headers: { 'Accept': 'application/json' },
            timeout: 10000
        });
        
        console.log('  ✅ SUCCESS!');
        console.log('  Response status:', response.status);
        return true;
        
    } catch (error) {
        const status = error.response?.status || 'No status';
        const statusText = error.response?.statusText || error.message;
        console.log(`  ❌ Failed: ${status} - ${statusText}`);
        
        // Check for specific error details
        if (error.response?.data) {
            console.log('  Error details:', JSON.stringify(error.response.data));
        }
        
        return false;
    }
}

// Test all combinations
async function runCredentialTests() {
    let successCount = 0;
    
    for (const combo of testCombinations) {
        const success = await testCredentials(combo.id, combo.pass, combo.name);
        if (success) {
            successCount++;
            console.log(`\n🎉 WORKING CREDENTIALS FOUND!`);
            console.log(`   Use ID: ${combo.id}`);
            console.log(`   Use Password: ${combo.pass}`);
            break; // Stop on first success
        }
        console.log(''); // Add spacing
    }
    
    if (successCount === 0) {
        console.log('\n❌ None of the credential combinations worked.');
        console.log('\n🔍 Diagnostic Information:');
        console.log('  - API endpoint is reachable');
        console.log('  - Authentication is required (401 responses)');
        console.log('  - Credentials may be incorrect or inactive');
        
        console.log('\n📞 Next Steps:');
        console.log('1. Contact CoreLogic/Trestle support to verify your credentials');
        console.log('2. Ask them to confirm:');
        console.log('   - Your API ID format');
        console.log('   - Your password/secret format');
        console.log('   - If your account is active');
        console.log('   - If your IP address needs whitelisting');
        console.log('   - The correct base URL for your account');
        console.log('3. Ask for a sample API call they can verify works');
    }
}

// Also test with a simple CURL-like approach to verify raw HTTP
async function testRawHTTP() {
    console.log('\n🌐 Testing raw HTTP request...\n');
    
    try {
        const credentials = Buffer.from(`${TRESTLE_API_ID}:${TRESTLE_PASSWORD}`).toString('base64');
        
        const response = await axios({
            method: 'GET',
            url: `${BASE_URL}/odata/Property?$top=1`,
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Accept': 'application/json',
                'User-Agent': 'TrestleAPITest/1.0'
            },
            timeout: 15000,
            validateStatus: function (status) {
                return true; // Accept any status code
            }
        });
        
        console.log('Raw HTTP Response:');
        console.log('  Status:', response.status, response.statusText);
        console.log('  Headers:', JSON.stringify(response.headers, null, 2));
        
        if (response.status === 200) {
            console.log('  ✅ SUCCESS! Data received:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
        } else {
            console.log('  Response Body:', JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        console.log('Raw HTTP Error:', error.message);
        if (error.response) {
            console.log('  Error Status:', error.response.status);
            console.log('  Error Data:', error.response.data);
        }
    }
}

// Run all tests
runCredentialTests().then(() => {
    return testRawHTTP();
}).catch(console.error); 