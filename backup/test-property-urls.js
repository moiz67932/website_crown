const axios = require('axios');

async function testPropertyUrls() {
  try {
    console.log('🔗 Testing Property URL Generation...\n');
    
    // Get properties from the API
    const response = await axios.get('http://localhost:3001/api/properties?limit=5');
    
    if (response.data.success) {
      const properties = response.data.data;
      console.log(`✅ Retrieved ${properties.length} properties\n`);
      
      properties.forEach((property, index) => {
        console.log(`🏠 Property ${index + 1}:`);
        console.log(`   ID: ${property.id}`);
        console.log(`   Listing Key: ${property.listing_key}`);
        console.log(`   Address: "${property.address}"`);
        console.log(`   Location: ${property.location}`);
        
        // Generate URL like PropertyCard would
        const cleanAddress = property.address ? 
          property.address.replace(/\s+/g, '-').replace(/[^\w-]/g, '').toLowerCase() : 
          'property';
        const cleanId = property.listing_key || property.id || 'unknown';
        const generatedUrl = `/properties/${cleanAddress}/${cleanId}`;
        
        console.log(`   Generated URL: ${generatedUrl}`);
        
        // Check for problematic URLs
        if (generatedUrl.includes('address-not-available') || generatedUrl.includes('unknown')) {
          console.log(`   ⚠️ PROBLEMATIC URL DETECTED!`);
        } else {
          console.log(`   ✅ URL looks good`);
        }
        console.log('');
      });
      
      console.log('🎯 Test completed!');
      console.log('💡 If you see "address-not-available" or "unknown" in URLs, the issue persists.');
      console.log('   Otherwise, the property cards should now generate proper URLs!');
      
    } else {
      console.log('❌ Failed to get properties:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPropertyUrls();
