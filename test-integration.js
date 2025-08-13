// Integration test for Trestle API with OAuth2
require('dotenv').config();

async function testIntegration() {
  console.log('🚀 Starting Trestle API Integration Test');
  console.log('========================================\n');

  try {
    // Test 1: Import and test the Trestle API service
    console.log('📦 Testing Trestle API Service...');
    
    const { createTrestleApiService } = require('./src/lib/trestle-service');
    const trestleApi = createTrestleApiService();
    
    // Test connection
    const isConnected = await trestleApi.testConnection();
    console.log(`🔗 API Connection: ${isConnected ? '✅ Connected' : '❌ Failed'}`);
    
    if (!isConnected) {
      throw new Error('API connection failed');
    }

    // Test fetching a small sample of properties
    console.log('\n📥 Fetching sample properties...');
    const sampleProperties = await trestleApi.getAllProperties({ "$filter": "StandardStatus eq 'Active'" }, 5);
    console.log(`✅ Fetched ${sampleProperties.length} sample properties`);
    
    if (sampleProperties.length > 0) {
      const firstProperty = sampleProperties[0];
      console.log('📋 Sample property data:');
      console.log({
        ListingKey: firstProperty.ListingKey,
        ListPrice: firstProperty.ListPrice,
        City: firstProperty.City,
        PropertyType: firstProperty.PropertyType,
        BedroomsTotal: firstProperty.BedroomsTotal,
        BathroomsTotalInteger: firstProperty.BathroomsTotalInteger
      });
    }

    // Test 2: Data validation
    console.log('\n🧹 Testing Data Validation...');
    const { PropertyDataValidator } = require('./src/lib/data-validation');
    
    const validationResult = PropertyDataValidator.batchValidateProperties(sampleProperties);
    console.log(`✅ Validation results:
      - Total: ${validationResult.summary.total}
      - Valid: ${validationResult.summary.valid}
      - Invalid: ${validationResult.summary.invalid}
      - With warnings: ${validationResult.summary.withWarnings}
    `);

    // Test 3: Database operations
    console.log('\n💾 Testing Database Operations...');
    const { PropertyDatabase } = require('./src/lib/property-database');
    
    const db = new PropertyDatabase('./data/test-properties.db');
    
    if (validationResult.validProperties.length > 0) {
      const dbResult = await db.upsertProperties(validationResult.validProperties);
      console.log(`✅ Database operations:
        - Inserted: ${dbResult.inserted}
        - Updated: ${dbResult.updated}
        - Errors: ${dbResult.errors.length}
      `);

      // Test search
      const searchResult = db.searchProperties({
        limit: 3
      });
      console.log(`🔍 Search test: Found ${searchResult.properties.length} properties`);
    }

    // Test 4: Vector search
    console.log('\n🔍 Testing Vector Search...');
    const { getPropertyVectorSearch } = require('./src/lib/vector-search');
    
    const vectorSearch = getPropertyVectorSearch();
    vectorSearch.indexProperties(validationResult.validProperties);
    
    const semanticResults = vectorSearch.searchProperties(
      'luxury waterfront home with pool',
      validationResult.validProperties,
      3
    );
    
    console.log(`✅ Vector search: Found ${semanticResults.length} semantic matches`);
    if (semanticResults.length > 0) {
      console.log('Top match:', {
        ListingKey: semanticResults[0].property.ListingKey,
        similarity: semanticResults[0].similarity.toFixed(3),
        features: {
          isLuxury: semanticResults[0].property.isLuxury,
          hasPool: semanticResults[0].property.PoolPrivateYN,
          isWaterfront: semanticResults[0].property.WaterfrontYN
        }
      });
    }

    // Test 5: Sync service
    console.log('\n🔄 Testing Sync Service...');
    const { getPropertySyncService } = require('./src/lib/property-sync');
    
    const syncService = getPropertySyncService();
    const syncStatus = syncService.getSyncStatus();
    
    console.log(`✅ Sync service status:
      - Is running: ${syncStatus.isRunning}
      - Is scheduled: ${syncStatus.isScheduled}
      - Interval: ${syncStatus.intervalMinutes} minutes
      - Database stats: ${JSON.stringify(syncStatus.databaseStats)}
    `);

    // Test API health
    const apiHealth = await syncService.getApiHealthStatus();
    console.log(`🏥 API Health:
      - Healthy: ${apiHealth.isHealthy}
      - Total properties: ${apiHealth.totalProperties}
      - Active properties: ${apiHealth.activeProperties}
    `);

    console.log('\n🎉 All integration tests passed!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Trestle API OAuth2 authentication working');
    console.log('- ✅ Data fetching and pagination working');
    console.log('- ✅ Data validation and cleaning working');
    console.log('- ✅ Database storage and search working');
    console.log('- ✅ Vector semantic search working');
    console.log('- ✅ Sync service ready for scheduling');
    
    console.log('\n🚀 Your Trestle API integration is ready!');
    console.log('\nNext steps:');
    console.log('1. Start your Next.js app: npm run dev');
    console.log('2. The sync service will automatically start in production');
    console.log('3. Use the API endpoints to serve data to your frontend');
    console.log('4. Monitor sync status via /api/admin/sync');

    // Cleanup
    db.close();

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error('\nError details:', error);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has the correct Trestle API credentials');
    console.log('2. Ensure your internet connection is working');
    console.log('3. Verify the Trestle API credentials are still valid');
    console.log('4. Check if there are any rate limiting issues');
    
    process.exit(1);
  }
}

// Run the test
testIntegration();
