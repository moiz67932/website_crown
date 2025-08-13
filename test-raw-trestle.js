const axios = require('axios');

async function testRawTrestleData() {
  try {
    console.log('🔍 Testing Raw Trestle API Response...\n');
    
    // Create a simple test that shows exactly what Trestle is returning
    const trestleResponse = await axios.get('http://localhost:3001/api/properties?limit=1&debug=true');
    
    if (trestleResponse.data.success) {
      const property = trestleResponse.data.data[0];
      console.log('📊 Full property object from API:');
      console.log(JSON.stringify(property, null, 2));
      
      // Check specific photo-related fields
      console.log('\n📸 Photo-related fields:');
      console.log('- Photos:', property.Photos);
      console.log('- PhotosCount:', property.PhotosCount);
      console.log('- images:', property.images);
      console.log('- image:', property.image);
      console.log('- main_image_url:', property.main_image_url);
      
    } else {
      console.log('❌ Failed to get properties');
    }
    
  } catch (error) {
    console.error('❌ Error testing raw data:', error.message);
  }
}

testRawTrestleData();
