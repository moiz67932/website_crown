const axios = require('axios');

async function debugUrlIssue() {
  try {
    console.log('🔍 Debugging URL parameter issue...\n');
    
    // Test 1: Check properties API response structure
    console.log('1️⃣ Testing Properties API structure...');
    const propertiesResponse = await axios.get('http://localhost:3001/api/properties?limit=2');
    
    if (propertiesResponse.data.success) {
      const properties = propertiesResponse.data.data;
      console.log('✅ Properties structure:');
      properties.forEach((prop, idx) => {
        console.log(`   Property ${idx + 1}:`);
        console.log(`     - id: "${prop.id}"`);
        console.log(`     - listing_key: "${prop.listing_key}"`);
        console.log(`     - address: "${prop.address}"`);
        
        // Generate expected URL like PropertyCard would
        const cleanAddress = prop.address ? prop.address.replace(/\s+/g, '-').replace(/[^\w-]/g, '').toLowerCase() : 'property';
        const cleanId = prop.listing_key || prop.id || 'unknown';
        const expectedUrl = `/properties/${cleanAddress}/${cleanId}`;
        console.log(`     - Generated URL: "${expectedUrl}"`);
      });
    }
    
    // Test 2: Try accessing a property detail directly with correct ID
    console.log('\n2️⃣ Testing Property Detail API...');
    const firstProperty = propertiesResponse.data.data[0];
    const testId = firstProperty.listing_key || firstProperty.id;
    
    try {
      const detailResponse = await axios.get(`http://localhost:3001/api/properties/${testId}`);
      if (detailResponse.data.success) {
        console.log(`✅ Property detail API works for ID: ${testId}`);
        console.log(`   - Property: ${detailResponse.data.data.address}`);
        console.log(`   - Price: $${detailResponse.data.data.list_price?.toLocaleString()}`);
      }
    } catch (error) {
      console.log(`❌ Property detail API failed for ID: ${testId}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }
    
    // Test 3: Test with problematic undefined
    console.log('\n3️⃣ Testing with undefined ID...');
    try {
      await axios.get('http://localhost:3001/api/properties/undefined');
      console.log('❌ Should have failed with undefined');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejects undefined ID with 400');
      } else {
        console.log(`⚠️ Unexpected error: ${error.response?.status}`);
      }
    }
    
    console.log('\n🎯 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugUrlIssue();
