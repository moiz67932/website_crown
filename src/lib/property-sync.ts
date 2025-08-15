import { createTrestleApiService } from './trestle-service';
import { PropertyDataValidator } from './data-validation';
import { PropertyDatabase } from './property-database';

export interface SyncResult {
  success: boolean;
  propertiesFetched: number;
  propertiesInserted: number;
  propertiesUpdated: number;
  errors: string[];
  durationMs: number;
  startTime: string;
  endTime: string;
}

export class PropertySyncService {
  private trestleApi = createTrestleApiService();
  private database = new PropertyDatabase();
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🔄 PropertySyncService initialized');
  }

  /**
   * Start scheduled sync every 15 minutes
   */
  startScheduledSync(): void {
    if (this.intervalId) {
      console.log('⚠️ Scheduled sync already running');
      return;
    }

    const intervalMs = (parseInt(process.env.TRESTLE_UPDATE_INTERVAL || '15')) * 60 * 1000; // Convert minutes to ms
    
    console.log(`🕒 Starting scheduled sync every ${intervalMs / 60000} minutes`);
    
    // Run initial sync
    this.syncRecentProperties().catch(error => {
      console.error('❌ Initial sync failed:', error);
    });

    // Set up recurring sync
    this.intervalId = setInterval(() => {
      if (!this.isRunning) {
        this.syncRecentProperties().catch(error => {
          console.error('❌ Scheduled sync failed:', error);
        });
      } else {
        console.log('⏭️ Skipping sync - previous sync still running');
      }
    }, intervalMs);

    console.log('✅ Scheduled sync started');
  }

  /**
   * Stop scheduled sync
   */
  stopScheduledSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Scheduled sync stopped');
    }
  }

  /**
   * Sync recently updated properties (last 24 hours)
   */
  async syncRecentProperties(): Promise<SyncResult> {
    return this.performSync('recent', async () => {
      console.log('📥 Syncing recently updated properties...');
      return await this.trestleApi.getRecentlyUpdatedProperties(24);
    });
  }

  /**
   * Sync all active properties
   */
  async syncAllActiveProperties(): Promise<SyncResult> {
    return this.performSync('all_active', async () => {
      console.log('📥 Syncing all active properties...');
      return await this.trestleApi.getActiveProperties(50000); // Limit to 50k
    });
  }

  /**
   * Sync properties by city
   */
  async syncPropertiesByCity(city: string): Promise<SyncResult> {
    return this.performSync(`city_${city}`, async () => {
      console.log(`📥 Syncing properties for city: ${city}...`);
      return await this.trestleApi.getPropertiesByCity(city, 10000);
    });
  }

  /**
   * Full initial sync
   */
  async performFullSync(): Promise<SyncResult> {
    return this.performSync('full', async () => {
      console.log('📥 Performing full sync...');
      return await this.trestleApi.getAllProperties({}, 100000); // Limit to 100k
    });
  }

  /**
   * Generic sync method
   */
  private async performSync(
    syncType: string,
    fetchFunction: () => Promise<any[]>
  ): Promise<SyncResult> {
    if (this.isRunning) {
      throw new Error('Sync already in progress');
    }

    this.isRunning = true;
    const startTime = new Date().toISOString();
    const startMs = Date.now();

    console.log(`🚀 Starting ${syncType} sync at ${startTime}`);

    let result: SyncResult = {
      success: false,
      propertiesFetched: 0,
      propertiesInserted: 0,
      propertiesUpdated: 0,
      errors: [],
      durationMs: 0,
      startTime,
      endTime: ''
    };

    try {
      // Step 1: Fetch properties from Trestle API
      console.log('🔍 Fetching properties from Trestle API...');
      const rawProperties = await fetchFunction();
      result.propertiesFetched = rawProperties.length;
      
      if (rawProperties.length === 0) {
        console.log('📭 No properties fetched');
        result.success = true;
        return result;
      }

      console.log(`📊 Fetched ${rawProperties.length} properties`);

      // Step 2: Validate and clean data
      console.log('🧹 Validating and cleaning property data...');
      const validation = PropertyDataValidator.batchValidateProperties(rawProperties);
      
      console.log(`✅ Validation summary:
        - Total: ${validation.summary.total}
        - Valid: ${validation.summary.valid}
        - Invalid: ${validation.summary.invalid}
        - With warnings: ${validation.summary.withWarnings}
      `);

      // Log invalid properties
      validation.invalidProperties.forEach(({ property, validation }) => {
        const errors = validation.errors.join(', ');
        result.errors.push(`Property ${property.ListingKey}: ${errors}`);
        console.error(`❌ Invalid property ${property.ListingKey}: ${errors}`);
      });

      if (validation.validProperties.length === 0) {
        console.log('❌ No valid properties to sync');
        result.success = false;
        return result;
      }

      // Step 3: Store in database
      console.log('💾 Storing properties in database...');
      const dbResult = await this.database.upsertProperties(validation.validProperties);
      
      result.propertiesInserted = dbResult.inserted;
      result.propertiesUpdated = dbResult.updated;
      result.errors.push(...dbResult.errors);

      console.log(`💾 Database results:
        - Inserted: ${dbResult.inserted}
        - Updated: ${dbResult.updated}
        - Errors: ${dbResult.errors.length}
      `);

      // Step 4: Success!
      result.success = dbResult.errors.length === 0;
      
      const endTime = new Date().toISOString();
      const durationMs = Date.now() - startMs;
      
      result.endTime = endTime;
      result.durationMs = durationMs;

      // Log sync operation
      this.database.logSync({
        syncDate: startTime,
        propertiesFetched: result.propertiesFetched,
        propertiesInserted: result.propertiesInserted,
        propertiesUpdated: result.propertiesUpdated,
        errors: result.errors.length > 0 ? result.errors : undefined,
        durationMs,
        status: result.success ? 'success' : (result.propertiesInserted + result.propertiesUpdated > 0 ? 'partial' : 'failed')
      });

      console.log(`🎉 ${syncType} sync completed in ${durationMs}ms`);
      console.log(`📈 Summary: ${result.propertiesFetched} fetched, ${result.propertiesInserted} inserted, ${result.propertiesUpdated} updated`);
      
      if (result.errors.length > 0) {
        console.log(`⚠️ ${result.errors.length} errors occurred during sync`);
      }

    } catch (error: any) {
      const endTime = new Date().toISOString();
      const durationMs = Date.now() - startMs;
      
      result.endTime = endTime;
      result.durationMs = durationMs;
      result.success = false;
      result.errors.push(`Sync failed: ${error.message}`);

      console.error(`❌ ${syncType} sync failed:`, error);

      // Log failed sync
      this.database.logSync({
        syncDate: startTime,
        propertiesFetched: result.propertiesFetched,
        propertiesInserted: result.propertiesInserted,
        propertiesUpdated: result.propertiesUpdated,
        errors: [error.message],
        durationMs,
        status: 'failed'
      });

    } finally {
      this.isRunning = false;
    }

    return result;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isRunning: boolean;
    isScheduled: boolean;
    intervalMinutes: number;
    lastSync?: any;
    databaseStats: any;
  } {
    const stats = this.database.getStats();
    
    return {
      isRunning: this.isRunning,
      isScheduled: this.intervalId !== null,
      intervalMinutes: parseInt(process.env.TRESTLE_UPDATE_INTERVAL || '15'),
      databaseStats: stats
    };
  }

  /**
   * Test API connection
   */
  async testApiConnection(): Promise<boolean> {
    try {
      return await this.trestleApi.testConnection();
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API health status
   */
  async getApiHealthStatus() {
    try {
      return await this.trestleApi.getHealthStatus();
    } catch (error: any) {
      return {
        isHealthy: false,
        totalProperties: 0,
        activeProperties: 0,
        lastUpdate: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Manual trigger for admin
   */
  async triggerManualSync(syncType: 'recent' | 'all' | 'full' = 'recent'): Promise<SyncResult> {
    console.log(`🔄 Manual sync triggered: ${syncType}`);
    
    switch (syncType) {
      case 'recent':
        return await this.syncRecentProperties();
      case 'all':
        return await this.syncAllActiveProperties();
      case 'full':
        return await this.performFullSync();
      default:
        throw new Error(`Unknown sync type: ${syncType}`);
    }
  }

  /**
   * Cleanup old sync logs (keep last 100 entries)
   */
  cleanupOldLogs(): void {
    try {
      const db = (this.database as any).db; // Access the private db property
      db.exec(`
        DELETE FROM sync_log 
        WHERE id NOT IN (
          SELECT id FROM sync_log 
          ORDER BY created_at DESC 
          LIMIT 100
        )
      `);
      
      db.exec(`
        DELETE FROM api_health_log 
        WHERE id NOT IN (
          SELECT id FROM api_health_log 
          ORDER BY created_at DESC 
          LIMIT 1000
        )
      `);
      
      console.log('🧹 Old logs cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup logs:', error);
    }
  }

  /**
   * Shutdown gracefully
   */
  shutdown(): void {
    console.log('🛑 Shutting down PropertySyncService...');
    this.stopScheduledSync();
    this.database.close();
    console.log('✅ PropertySyncService shutdown complete');
  }
}

// Create singleton instance
let syncServiceInstance: PropertySyncService | null = null;

export function getPropertySyncService(): PropertySyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new PropertySyncService();
  }
  return syncServiceInstance;
}

// Auto-start scheduled sync in production
if (process.env.NODE_ENV === 'production') {
  const syncService = getPropertySyncService();
  syncService.startScheduledSync();
  
  // Cleanup old logs every 24 hours
  setInterval(() => {
    syncService.cleanupOldLogs();
  }, 24 * 60 * 60 * 1000);
}
