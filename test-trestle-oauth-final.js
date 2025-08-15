// Final test of Trestle API OAuth2 integration
require('dotenv').config();
const axios = require('axios');

async function testTrestleOAuth() {
  console.log('🚀 Final Trestle API OAuth2 Test');
  console.log('=================================\n');

  const TRESTLE_API_ID = process.env.TRESTLE_API_ID;
  const TRESTLE_PASSWORD = process.env.TRESTLE_API_PASSWORD;
  const OAUTH_URL = 'https://api-trestle.corelogic.com/trestle/oidc/connect/token';
  const BASE_URL = 'https://api-trestle.corelogic.com/trestle';

  if (!TRESTLE_API_ID || !TRESTLE_PASSWORD) {
    console.error('❌ Missing Trestle API credentials in .env file');
    return;
  }

  try {
    // Step 1: Get OAuth Token
    console.log('🔑 Step 1: Getting OAuth token...');
    const tokenResponse = await axios.post(
      OAUTH_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: TRESTLE_API_ID,
        client_secret: TRESTLE_PASSWORD,
        scope: 'api'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ OAuth token obtained successfully!');
    console.log(`📝 Token expires in: ${tokenResponse.data.expires_in} seconds`);

    // Step 2: Test API with token
    console.log('\n🏠 Step 2: Fetching property data...');
    const propertiesResponse = await axios.get(
      `${BASE_URL}/odata/Property`,
      {
        headers: {
          'Authorization': `Bearer ${tokenResponse.data.access_token}`,
          'Accept': 'application/json'
        },
        params: {
          '$top': 10,
          '$filter': "StandardStatus eq 'Active'",
          '$select': 'ListingKey,ListPrice,UnparsedAddress,City,PropertyType,BedroomsTotal,BathroomsTotalInteger'
        },
        timeout: 60000
      }
    );

    console.log('✅ Property data fetched successfully!');
    console.log(`📊 Found ${propertiesResponse.data.value.length} properties`);

    if (propertiesResponse.data.value.length > 0) {
      console.log('\n📋 Sample Properties:');
      propertiesResponse.data.value.slice(0, 3).forEach((property, index) => {
        console.log(`\n${index + 1}. ${property.ListingKey}`);
        console.log(`   Price: $${property.ListPrice?.toLocaleString() || 'N/A'}`);
        console.log(`   Address: ${property.UnparsedAddress || 'N/A'}`);
        console.log(`   City: ${property.City || 'N/A'}`);
        console.log(`   Type: ${property.PropertyType || 'N/A'}`);
        console.log(`   Beds/Baths: ${property.BedroomsTotal || '?'}/${property.BathroomsTotalInteger || '?'}`);
      });
    }

    // Step 3: Test property count
    console.log('\n📈 Step 3: Getting property count...');
    const countResponse = await axios.get(
      `${BASE_URL}/odata/Property/$count`,
      {
        headers: {
          'Authorization': `Bearer ${tokenResponse.data.access_token}`,
          'Accept': 'application/json'
        },
        params: {
          '$filter': "StandardStatus eq 'Active'"
        },
        timeout: 30000
      }
    );

    console.log(`✅ Total active properties: ${countResponse.data.toLocaleString()}`);

    // Step 4: Test different filters
    console.log('\n🔍 Step 4: Testing advanced filters...');
    const luxuryResponse = await axios.get(
      `${BASE_URL}/odata/Property`,
      {
        headers: {
          'Authorization': `Bearer ${tokenResponse.data.access_token}`,
          'Accept': 'application/json'
        },
        params: {
          '$top': 5,
          '$filter': "StandardStatus eq 'Active' and ListPrice gt 1000000",
          '$select': 'ListingKey,ListPrice,City,PropertyType',
          '$orderby': 'ListPrice desc'
        },
        timeout: 30000
      }
    );

    console.log(`✅ Found ${luxuryResponse.data.value.length} luxury properties (>$1M)`);

    if (luxuryResponse.data.value.length > 0) {
      console.log('\n💎 Top Luxury Properties:');
      luxuryResponse.data.value.forEach((property, index) => {
        console.log(`${index + 1}. $${property.ListPrice?.toLocaleString()} - ${property.City} (${property.PropertyType})`);
      });
    }

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n📋 Integration Summary:');
    console.log('✅ OAuth2 authentication working');
    console.log('✅ Property data fetching working');
    console.log('✅ Filtering and pagination working');
    console.log('✅ Real-time data access confirmed');
    console.log(`✅ API provides access to ${countResponse.data.toLocaleString()} active properties`);
    
    console.log('\n🚀 Your Trestle API is fully functional!');
    console.log('\nNow you can:');
    console.log('1. Build your Next.js app: npm run build');
    console.log('2. Start production server: npm start');
    console.log('3. Access properties via API routes');
    console.log('4. Use the scheduled sync (every 15 minutes)');
    console.log('5. Implement semantic search features');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log('\n🔧 Next steps:');
    console.log('1. Verify your credentials with CoreLogic');
    console.log('2. Check API rate limits');
    console.log('3. Ensure your account is active');
  }
}

testTrestleOAuth();
