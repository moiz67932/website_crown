import axios, { AxiosResponse } from 'axios';
import { 
  TrestleProperty, 
  TrestleResponse, 
  TrestleTokenResponse, 
  TrestleApiConfig, 
  TrestleApiError 
} from './trestle-types';

export class TrestleApiService {
  private config: TrestleApiConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private retryCount: number = 3;
  private retryDelay: number = 1000; // 1 second
  
  constructor(config: TrestleApiConfig) {
    this.config = config;
  }

  /**
   * Get OAuth2 access token with retry mechanism
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5-minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(`🔑 Requesting OAuth token (attempt ${attempt}/${this.retryCount})`);
        
        const response: AxiosResponse<TrestleTokenResponse> = await axios.post(
          this.config.oauthUrl,
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.config.apiId,
            client_secret: this.config.apiPassword,
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

        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        
        console.log(`✅ OAuth token obtained, expires in ${response.data.expires_in} seconds`);
        return this.accessToken;
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ OAuth token request failed (attempt ${attempt}):`, error.response?.data || error.message);
        
        if (attempt < this.retryCount) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new TrestleApiError(
      'Failed to obtain OAuth token after all retry attempts',
      lastError?.response?.status,
      lastError
    );
  }

  /**
   * Make authenticated API request with retry mechanism
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
    timeout: number = 60000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const token = await this.getAccessToken();
        
        const response: AxiosResponse<T> = await axios.get(
          `${this.config.baseUrl}${endpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            params,
            timeout
          }
        );

        return response.data;
        
      } catch (error: any) {
        lastError = error;
        
        // If token expired, clear it and retry
        if (error.response?.status === 401) {
          console.log('🔄 Token expired, clearing cache');
          this.accessToken = null;
          this.tokenExpiry = 0;
        }
        
        console.error(`❌ API request failed (attempt ${attempt}):`, error.response?.data || error.message);
        
        if (attempt < this.retryCount) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new TrestleApiError(
      `API request failed after ${this.retryCount} attempts: ${endpoint}`,
      lastError?.response?.status,
      lastError
    );
  }

  /**
   * Get all properties with pagination
   */
  async getAllProperties(
    filters: Record<string, any> = {},
    maxRecords: number = 10000
  ): Promise<TrestleProperty[]> {
    const allProperties: TrestleProperty[] = [];
    let skip = 0;
    const top = 1000; // Maximum allowed per request
    let hasMore = true;

    console.log(`📊 Starting property extraction with filters:`, filters);
    console.log(`📈 Maximum records to fetch: ${maxRecords}`);

    while (hasMore && allProperties.length < maxRecords) {
      try {
        const params = {
          '$top': Math.min(top, maxRecords - allProperties.length),
          '$skip': skip,
          '$count': 'true',
          '$orderby': 'ModificationTimestamp desc',
          ...filters
        };

        console.log(`📥 Fetching properties ${skip + 1} to ${skip + params['$top']}...`);

        const response = await this.makeRequest<TrestleResponse>('/odata/Property', params);
        
        if (response.value && response.value.length > 0) {
          allProperties.push(...response.value);
          skip += response.value.length;
          
          console.log(`✅ Fetched ${response.value.length} properties. Total: ${allProperties.length}`);
          
          // Check if there are more records
          hasMore = response['@odata.nextLink'] !== undefined && response.value.length === params['$top'];
        } else {
          hasMore = false;
          console.log('📭 No more properties to fetch');
        }

        // Add delay between requests to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error('❌ Error fetching properties batch:', error);
        throw error;
      }
    }

    console.log(`🎉 Property extraction completed. Total properties: ${allProperties.length}`);
    return allProperties;
  }

  /**
   * Get active properties only
   */
  async getActiveProperties(maxRecords: number = 10000): Promise<TrestleProperty[]> {
    const properties = await this.getAllProperties({
      "$filter": "StandardStatus eq 'Active'"
    }, maxRecords);

    // For performance, only fetch photos for the first few properties
    // In a real app, you might want to implement lazy loading
    const propertiesWithPhotos = await this.enrichPropertiesWithPhotos(properties.slice(0, 10));
    
    return [...propertiesWithPhotos, ...properties.slice(10)];
  }

  /**
   * Enrich properties with photos (batch operation)
   */
  async enrichPropertiesWithPhotos(properties: TrestleProperty[]): Promise<TrestleProperty[]> {
    const enrichedProperties = await Promise.all(
      properties.map(async (property) => {
        if (property.PhotosCount && property.PhotosCount > 0) {
          const photos = await this.getPropertyPhotos(property.ListingKey);
          return { ...property, Photos: photos };
        }
        return property;
      })
    );
    
    return enrichedProperties;
  }

  /**
   * Get property by listing key
   */
  async getPropertyByKey(listingKey: string): Promise<TrestleProperty | null> {
    try {
      console.log(`🏠 Fetching property ${listingKey}...`);
      
      const params = {
        '$filter': `ListingKey eq '${listingKey}'`,
        '$top': 1
      };

      const response = await this.makeRequest<TrestleResponse>('/odata/Property', params);
      
      if (response.value && response.value.length > 0) {
        const property = response.value[0];
        console.log(`✅ Found property ${listingKey}`);
        
        // Skip photo fetching for now due to Media endpoint issues
        // if (property.PhotosCount && property.PhotosCount > 0) {
        //   console.log(`📸 Fetching ${property.PhotosCount} photos for property ${listingKey}...`);
        //   const photos = await this.getPropertyPhotos(listingKey);
        //   property.Photos = photos;
        // }
        
        return property;
      } else {
        console.log(`❌ Property ${listingKey} not found`);
        return null;
      }

    } catch (error: any) {
      console.error(`❌ Error fetching property ${listingKey}:`, error.message);
      throw new Error(`Failed to fetch property: ${error.message}`);
    }
  }

  /**
   * Get photos for a specific property
   */
  async getPropertyPhotos(listingKey: string): Promise<string[]> {
    try {
      const params = {
        '$filter': `ListingKey eq '${listingKey}'`,
        '$orderby': 'Order',
        '$top': 50  // Limit to first 50 photos
      };

      console.log(`📸 Requesting photos for ${listingKey} from /odata/Media...`);
      const response = await this.makeRequest<any>('/odata/Media', params);
      
      if (response.value && response.value.length > 0) {
        const photoUrls = response.value
          .filter((media: any) => media.MediaURL && media.MediaCategory === 'Photo')
          .map((media: any) => media.MediaURL);
        
        console.log(`✅ Found ${photoUrls.length} photos for property ${listingKey}`);
        return photoUrls;
      } else {
        console.log(`📷 No photos found for property ${listingKey}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error fetching photos for ${listingKey}:`, error);
      // Don't throw error for photos, just return empty array
      return [];
    }
  }

  /**
   * Get properties by city
   */
  async getPropertiesByCity(city: string, maxRecords: number = 5000): Promise<TrestleProperty[]> {
    return this.getAllProperties({
      "$filter": `City eq '${city}' and StandardStatus eq 'Active'`
    }, maxRecords);
  }

  /**
   * Get properties by price range
   */
  async getPropertiesByPriceRange(
    minPrice: number,
    maxPrice: number,
    maxRecords: number = 5000
  ): Promise<TrestleProperty[]> {
    return this.getAllProperties({
      "$filter": `ListPrice ge ${minPrice} and ListPrice le ${maxPrice} and StandardStatus eq 'Active'`
    }, maxRecords);
  }

  /**
   * Get recently updated properties
   */
  async getRecentlyUpdatedProperties(hoursAgo: number = 24): Promise<TrestleProperty[]> {
    const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    return this.getAllProperties({
      "$filter": `ModificationTimestamp ge ${timestamp}`
    });
  }

  /**
   * Get property count
   */
  async getPropertyCount(filters: Record<string, any> = {}): Promise<number> {
    try {
      const params = {
        '$count': 'true',
        '$top': 0,
        ...filters
      };

      const response = await this.makeRequest<TrestleResponse>('/odata/Property', params);
      return response['@odata.count'] || 0;
    } catch (error) {
      console.error('❌ Error getting property count:', error);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Trestle API connection...');
      
      const response = await this.makeRequest<TrestleResponse>('/odata/Property', {
        '$top': 1,
        '$select': 'ListingKey,ListPrice'
      });

      const isWorking = response.value && response.value.length > 0;
      console.log(isWorking ? '✅ API connection successful!' : '❌ API connection failed - no data returned');
      
      return isWorking;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    totalProperties: number;
    activeProperties: number;
    lastUpdate: string;
    error?: string;
  }> {
    try {
      const [totalCount, activeCount] = await Promise.all([
        this.getPropertyCount(),
        this.getPropertyCount({ "$filter": "StandardStatus eq 'Active'" })
      ]);

      return {
        isHealthy: true,
        totalProperties: totalCount,
        activeProperties: activeCount,
        lastUpdate: new Date().toISOString()
      };
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
}

// Factory function to create configured service
export function createTrestleApiService(): TrestleApiService {
  const config: TrestleApiConfig = {
    apiId: process.env.TRESTLE_API_ID || '',
    apiPassword: process.env.TRESTLE_API_PASSWORD || '',
    baseUrl: process.env.TRESTLE_BASE_URL || 'https://api-trestle.corelogic.com/trestle',
    oauthUrl: process.env.TRESTLE_OAUTH_URL || 'https://api-trestle.corelogic.com/trestle/oidc/connect/token'
  };

  if (!config.apiId || !config.apiPassword) {
    throw new Error('Trestle API credentials not configured. Please set TRESTLE_API_ID and TRESTLE_API_PASSWORD in your .env file.');
  }

  return new TrestleApiService(config);
}
