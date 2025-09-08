const axios = require('axios');

async function testPropertyDetailUrl() {
  try {
    console.log('🧪 Testing Property Detail URL Integration...\n');
    
    // Get a property to test with
    const propertiesResponse = await axios.get('http://localhost:3001/api/properties?limit=1');
    const property = propertiesResponse.data.data[0];
    
    console.log('🏠 Test Property:');
    console.log(`   ID: ${property.id}`);
    console.log(`   Address: ${property.address}`);
    console.log(`   Listing Key: ${property.listing_key}`);
    
    // Generate URL like PropertyCard would
    const cleanAddress = property.address.replace(/\s+/g, '-').replace(/[^\w-]/g, '').toLowerCase();
    const propertyUrl = `/properties/${cleanAddress}/${property.listing_key}`;
    
    console.log(`\n🔗 Generated URL: ${propertyUrl}`);
    
    // Test the property detail API endpoint directly
    console.log('\n📡 Testing property detail API endpoint...');
    const detailResponse = await axios.get(`http://localhost:3001/api/properties/${property.listing_key}`);
    
    if (detailResponse.data.success) {
      console.log('✅ Property detail API works!');
      console.log(`   Property: ${detailResponse.data.data.address}`);
      console.log(`   Price: $${detailResponse.data.data.list_price?.toLocaleString()}`);
      console.log(`   Bedrooms: ${detailResponse.data.data.bedrooms}`);
      console.log(`   Bathrooms: ${detailResponse.data.data.bathrooms}`);
    } else {
      console.log('❌ Property detail API failed');
    }
    
    console.log('\n✨ Now you can test in browser:');
    console.log(`   1. Go to: http://localhost:3001/properties`);
    console.log(`   2. Click on a property card`);
    console.log(`   3. Should navigate to: http://localhost:3001${propertyUrl}`);
    console.log('   4. Property details should load from new API');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPropertyDetailUrl();
