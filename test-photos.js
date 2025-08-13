const axios = require('axios');

async function testPropertyPhotos() {
  try {
    console.log('📸 Testing Property Photos Integration...\n');
    
    // Test 1: Check if properties API now returns photo data
    console.log('1️⃣ Testing Properties API for photo data...');
    const response = await axios.get('http://localhost:3001/api/properties?limit=2');
    
    if (response.data.success) {
      const properties = response.data.data;
      console.log(`✅ Retrieved ${properties.length} properties\n`);
      
      properties.forEach((property, index) => {
        console.log(`🏠 Property ${index + 1}:`);
        console.log(`   ID: ${property.id}`);
        console.log(`   Address: ${property.address}`);
        console.log(`   Image: ${property.image}`);
        console.log(`   Images array length: ${property.images?.length || 0}`);
        console.log(`   Photos count: ${property.photosCount || 0}`);
        console.log(`   Main image URL: ${property.main_image_url}`);
        
        if (property.images && property.images.length > 0) {
          console.log(`   🖼️  Images:`);
          property.images.slice(0, 3).forEach((img, i) => {
            console.log(`     ${i + 1}. ${img}`);
          });
          if (property.images.length > 3) {
            console.log(`     ... and ${property.images.length - 3} more`);
          }
        }
        console.log('');
      });
      
      // Check if we're getting real photo URLs or just placeholders
      const hasRealPhotos = properties.some(p => 
        p.image && !p.image.includes('placeholder') && 
        p.images && p.images.some(img => !img.includes('placeholder'))
      );
      
      if (hasRealPhotos) {
        console.log('✅ SUCCESS: Found real photo URLs from Trestle API!');
      } else {
        console.log('⚠️  WARNING: All properties still using placeholder images');
        console.log('   This might mean:');
        console.log('   1. Trestle API is not returning photo data');
        console.log('   2. Photos field is empty in the API response');
        console.log('   3. Photos are not included in the $select query');
      }
      
    } else {
      console.log('❌ Failed to get properties:', response.data.error);
    }
    
    console.log('\n2️⃣ Testing single property detail for photos...');
    
    // Get the first property ID for detail test
    if (response.data.success && response.data.data.length > 0) {
      const propertyId = response.data.data[0].listing_key;
      console.log(`   Testing property detail for ID: ${propertyId}`);
      
      const detailResponse = await axios.get(`http://localhost:3001/api/properties/${propertyId}`);
      
      if (detailResponse.data.success) {
        const detail = detailResponse.data.data;
        console.log(`   ✅ Property detail retrieved`);
        console.log(`   Main image: ${detail.main_image_url}`);
        console.log(`   Images count: ${detail.images?.length || 0}`);
        console.log(`   Photos count: ${detail.photosCount || 0}`);
        
        if (detail.images && detail.images.length > 0) {
          console.log(`   First 3 images:`);
          detail.images.slice(0, 3).forEach((img, i) => {
            console.log(`     ${i + 1}. ${img}`);
          });
        }
      } else {
        console.log(`   ❌ Failed to get property detail: ${detailResponse.data.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing photos:', error.message);
  }
}

testPropertyPhotos();
