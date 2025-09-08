const axios = require('axios');

async function testPropertyDetailAPI() {
  try {
    console.log('🧪 Testing Property Detail API...\n');
    
    // Test 1: Get a list of properties first to get a valid ID
    console.log('1️⃣ Getting property list to find a valid ID...');
    const listResponse = await axios.get('http://localhost:3001/api/properties?limit=3');
    
    if (!listResponse.data.success || listResponse.data.data.length === 0) {
      console.log('❌ Could not get property list');
      return;
    }
    
    const firstProperty = listResponse.data.data[0];
    console.log(`✅ Found property: ${firstProperty.id} - ${firstProperty.address}`);
    
    // Test 2: Get property detail
    console.log('\n2️⃣ Testing property detail fetch...');
    const detailResponse = await axios.get(`http://localhost:3001/api/properties/${firstProperty.id}`);
    
    if (detailResponse.data.success) {
      console.log('✅ Property detail fetched successfully!');
      console.log('📊 Property details:', {
        id: detailResponse.data.data._id,
        address: detailResponse.data.data.address,
        price: detailResponse.data.data.list_price,
        bedrooms: detailResponse.data.data.bedrooms,
        bathrooms: detailResponse.data.data.bathrooms,
        agent: detailResponse.data.data.list_agent_full_name
      });
    } else {
      console.log('❌ Property detail fetch failed:', detailResponse.data.error);
    }
    
    // Test 3: Test with an invalid ID
    console.log('\n3️⃣ Testing invalid property ID handling...');
    try {
      await axios.get('http://localhost:3001/api/properties/invalid-id');
      console.log('❌ Should have failed with invalid ID');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly handles invalid property ID with 404');
      } else {
        console.log('⚠️ Unexpected error for invalid ID:', error.response?.status);
      }
    }
    
    // Test 4: Test with undefined ID
    console.log('\n4️⃣ Testing undefined property ID handling...');
    try {
      await axios.get('http://localhost:3001/api/properties/undefined');
      console.log('❌ Should have failed with undefined ID');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly handles undefined property ID with 400');
      } else {
        console.log('⚠️ Unexpected error for undefined ID:', error.response?.status);
      }
    }
    
    console.log('\n🎉 Property Detail API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testPropertyDetailAPI();
