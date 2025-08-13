const axios = require('axios');

async function testAPIDirect() {
  try {
    console.log('🔍 Testing API directly...\n');
    
    const response = await axios.get('http://localhost:3001/api/properties?limit=2');
    
    console.log('📊 API Response Status:', response.status);
    console.log('📊 API Response Success:', response.data.success);
    
    if (response.data.success) {
      console.log('📊 Number of properties returned:', response.data.data.length);
      
      if (response.data.data.length > 0) {
        console.log('\n🏠 First property raw data:');
        console.log(JSON.stringify(response.data.data[0], null, 2));
      }
    } else {
      console.log('❌ API Error:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPIDirect();
