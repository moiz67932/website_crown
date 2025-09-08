import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Environment variables
const TRESTLE_API_ID = process.env.TRESTLE_API_ID!;
const TRESTLE_API_PASSWORD = process.env.TRESTLE_API_PASSWORD!;
const TRESTLE_BASE_URL = process.env.TRESTLE_BASE_URL || 'https://api-trestle.corelogic.com/trestle';
const TRESTLE_OAUTH_URL = process.env.TRESTLE_OAUTH_URL || 'https://api-trestle.corelogic.com/trestle/oidc/connect/token';

// Interfaces for Trestle API responses
export interface TrestleProperty {
  ListingKey: string;
  ListPrice?: number;
  UnparsedAddress?: string;
  StandardStatus?: string;
  PropertyType?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  LivingArea?: number;
  LotSizeAcres?: number;
  LotSizeSquareFeet?: number;
  YearBuilt?: number;
  ListingContractDate?: string;
  OnMarketDate?: string;
  DaysOnMarket?: number;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  CountyOrParish?: string;
  ModificationTimestamp?: string;
  Latitude?: number;
  Longitude?: number;
  ListAgentName?: string;
  ListOfficeName?: string;
  PublicRemarks?: string;
  PrivateRemarks?: string;
  InternetAddressDisplayYN?: boolean;
  Photos?: string[];
  PhotosCount?: number;
  VirtualTourURLUnbranded?: string;
  Cooling?: string;
  Heating?: string;
  ParkingTotal?: number;
  GarageSpaces?: number;
  WaterSource?: string;
  Sewer?: string;
  ElectricOnPropertyYN?: boolean;
  InternetYN?: boolean;
  CableTvYN?: boolean;
  SecuritySystemYN?: boolean;
  Pool?: string;
  Spa?: string;
  Fireplace?: string;
  FireplacesTotal?: number;
  View?: string;
  WaterfrontYN?: boolean;
  PoolPrivateYN?: boolean;
  ViewYN?: boolean;
  PetsAllowed?: string;
  AssociationFee?: number;
  TaxAnnualAmount?: number;
  TaxYear?: number;
  Zoning?: string;
  PropertySubType?: string;
  ArchitecturalStyle?: string;
  ConstructionMaterials?: string;
  RoofMaterial?: string;
  FoundationDetails?: string;
  InteriorFeatures?: string;
  ExteriorFeatures?: string;
  Appliances?: string;
  LaundryFeatures?: string;
  Utilities?: string;
  CommunityFeatures?: string;
}

export interface TrestleApiResponse<T> {
  '@odata.context': string;
  '@odata.nextLink'?: string;
  '@odata.count'?: number;
  value: T[];
}

export interface TrestleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface TrestleError {
  error?: string;
  error_description?: string;
  statusCode?: string;
  fault?: {
    faultstring: string;
    detail: {
      errorcode: string;
    };
  };
}

export interface PropertySearchFilters {
  city?: string;
  state?: string;
  postalCode?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minLivingArea?: number;
  maxLivingArea?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  standardStatus?: string[];
  maxDaysOnMarket?: number;
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
  limit?: number;
  skip?: number;
}

// Cache for OAuth tokens
interface TokenCache {
  token: string;
  expiresAt: number;
}

export class TrestleAPIService {
  private axiosInstance: AxiosInstance;
  private tokenCache: TokenCache | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Trestle API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get OAuth2 access token with caching and retry logic
   */
  private async getAccessToken(retryCount = 0): Promise<string> {
    try {
      // Check if we have a valid cached token
      if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
        return this.tokenCache.token;
      }

      console.log('🔑 Requesting new OAuth2 token...');
      
      const response: AxiosResponse<TrestleTokenResponse> = await axios.post(
        TRESTLE_OAUTH_URL,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: TRESTLE_API_ID,
          client_secret: TRESTLE_API_PASSWORD,
          scope: 'api',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );

      const { access_token, expires_in } = response.data;
      
      // Cache the token with 5 minutes buffer before expiry
      this.tokenCache = {
        token: access_token,
        expiresAt: Date.now() + (expires_in - 300) * 1000,
      };

      console.log('✅ OAuth2 token obtained successfully');
      return access_token;

    } catch (error: any) {
      console.error('❌ Failed to get OAuth2 token:', error.response?.data || error.message);
      
      if (retryCount < this.maxRetries) {
        console.log(`🔄 Retrying token request (${retryCount + 1}/${this.maxRetries})...`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.getAccessToken(retryCount + 1);
      }
      
      throw new Error(`Failed to authenticate with Trestle API after ${this.maxRetries} attempts`);
    }
  }

  /**
   * Make authenticated API request with retry logic
   */
  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
    retryCount = 0
  ): Promise<T> {
    try {
      const token = await this.getAccessToken();
      
      const response: AxiosResponse<T> = await this.axiosInstance.get(
        `${TRESTLE_BASE_URL}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        }
      );

      return response.data;

    } catch (error: any) {
      // If token expired or unauthorized, clear cache and retry
      if (error.response?.status === 401 && this.tokenCache) {
        console.log('🔄 Token expired, clearing cache and retrying...');
        this.tokenCache = null;
        
        if (retryCount < this.maxRetries) {
          await this.delay(this.retryDelay);
          return this.makeAuthenticatedRequest<T>(endpoint, params, retryCount + 1);
        }
      }

      // Retry on network errors or 5xx errors
      if (
        retryCount < this.maxRetries &&
        (error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' || 
         (error.response?.status >= 500))
      ) {
        console.log(`🔄 Retrying request (${retryCount + 1}/${this.maxRetries})...`);
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.makeAuthenticatedRequest<T>(endpoint, params, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Build OData filter string from search filters
   */
  private buildODataFilter(filters: PropertySearchFilters): string {
    const conditions: string[] = [];

    // Price range
    if (filters.minPrice !== undefined) {
      conditions.push(`ListPrice ge ${filters.minPrice}`);
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(`ListPrice le ${filters.maxPrice}`);
    }

    // Property type
    if (filters.propertyType) {
      conditions.push(`PropertyType eq '${filters.propertyType}'`);
    }

    // Bedrooms
    if (filters.minBedrooms !== undefined) {
      conditions.push(`BedroomsTotal ge ${filters.minBedrooms}`);
    }
    if (filters.maxBedrooms !== undefined) {
      conditions.push(`BedroomsTotal le ${filters.maxBedrooms}`);
    }

    // Bathrooms
    if (filters.minBathrooms !== undefined) {
      conditions.push(`BathroomsTotalInteger ge ${filters.minBathrooms}`);
    }
    if (filters.maxBathrooms !== undefined) {
      conditions.push(`BathroomsTotalInteger le ${filters.maxBathrooms}`);
    }

    // Living area
    if (filters.minLivingArea !== undefined) {
      conditions.push(`LivingArea ge ${filters.minLivingArea}`);
    }
    if (filters.maxLivingArea !== undefined) {
      conditions.push(`LivingArea le ${filters.maxLivingArea}`);
    }

    // Year built
    if (filters.minYearBuilt !== undefined) {
      conditions.push(`YearBuilt ge ${filters.minYearBuilt}`);
    }
    if (filters.maxYearBuilt !== undefined) {
      conditions.push(`YearBuilt le ${filters.maxYearBuilt}`);
    }

    // Location
    if (filters.city) {
      conditions.push(`City eq '${filters.city}'`);
    }
    if (filters.state) {
      conditions.push(`StateOrProvince eq '${filters.state}'`);
    }
    if (filters.postalCode) {
      conditions.push(`PostalCode eq '${filters.postalCode}'`);
    }

    // Standard status
    if (filters.standardStatus && filters.standardStatus.length > 0) {
      const statusConditions = filters.standardStatus
        .map(status => `StandardStatus eq '${status}'`)
        .join(' or ');
      conditions.push(`(${statusConditions})`);
    } else {
      // Default to active listings
      conditions.push("StandardStatus eq 'Active'");
    }

    // Days on market
    if (filters.maxDaysOnMarket !== undefined) {
      conditions.push(`DaysOnMarket le ${filters.maxDaysOnMarket}`);
    }

    // Geographic radius search (simplified - real implementation would use geo functions)
    if (filters.latitude && filters.longitude && filters.radius) {
      const latRange = filters.radius / 69; // Approximate degrees per mile for latitude
      const lonRange = filters.radius / (69 * Math.cos(filters.latitude * Math.PI / 180));
      
      conditions.push(
        `Latitude ge ${filters.latitude - latRange} and Latitude le ${filters.latitude + latRange}`
      );
      conditions.push(
        `Longitude ge ${filters.longitude - lonRange} and Longitude le ${filters.longitude + lonRange}`
      );
    }

    return conditions.join(' and ');
  }

  /**
   * Get all properties with comprehensive filters
   */
  async getProperties(filters: PropertySearchFilters = {}): Promise<TrestleProperty[]> {
    try {
      console.log('🏠 Fetching properties from Trestle API...');
      
      const params: Record<string, any> = {
        $select: [
          'ListingKey',
          'ListPrice',
          'UnparsedAddress',
          'StandardStatus',
          'PropertyType',
          'BedroomsTotal',
          'BathroomsTotalInteger',
          'LivingArea',
          'LotSizeAcres',
          'YearBuilt',
          'ListingContractDate',
          'OnMarketDate',
          'DaysOnMarket',
          'City',
          'StateOrProvince',
          'PostalCode',
          'CountyOrParish',
          'Latitude',
          'Longitude',
          'ListAgentName',
          'ListOfficeName',
          'PublicRemarks',
          'InternetAddressDisplayYN',
          'Photos',
          'PhotosCount',
          'VirtualTourURLUnbranded',
          'Cooling',
          'Heating',
          'ParkingTotal',
          'GarageSpaces',
          'WaterSource',
          'Sewer',
          'ElectricOnPropertyYN',
          'InternetYN',
          'CableTvYN',
          'SecuritySystemYN',
          'Pool',
          'Spa',
          'Fireplace',
          'View',
          'WaterfrontYN',
          'PetsAllowed',
          'AssociationFee',
          'TaxAnnualAmount',
          'TaxYear',
          'Zoning',
          'PropertySubType',
          'ArchitecturalStyle',
          'ConstructionMaterials',
          'RoofMaterial',
          'FoundationDetails',
          'InteriorFeatures',
          'ExteriorFeatures',
          'Appliances',
          'LaundryFeatures',
          'Utilities',
          'CommunityFeatures'
        ].join(','),
        $top: filters.limit || 100,
        $skip: filters.skip || 0,
        $orderby: 'OnMarketDate desc'
      };

      const filterString = this.buildODataFilter(filters);
      if (filterString) {
        params.$filter = filterString;
      }

      console.log('📊 Filter applied:', filterString || 'None');

      const response = await this.makeAuthenticatedRequest<TrestleApiResponse<TrestleProperty>>(
        '/odata/Property',
        params
      );

      console.log(`✅ Retrieved ${response.value.length} properties`);
      return this.validateAndCleanProperties(response.value);

    } catch (error: any) {
      console.error('❌ Error fetching properties:', error.message);
      throw new Error(`Failed to fetch properties: ${error.message}`);
    }
  }

  /**
   * Get property by listing key
   */
  async getPropertyByKey(listingKey: string): Promise<TrestleProperty | null> {
    try {
      console.log(`🏠 Fetching property ${listingKey}...`);
      
      const response = await this.makeAuthenticatedRequest<TrestleApiResponse<TrestleProperty>>(
        '/odata/Property',
        {
          $filter: `ListingKey eq '${listingKey}'`,
          $select: '*'
        }
      );

      if (response.value.length === 0) {
        return null;
      }

      const cleanedProperties = this.validateAndCleanProperties(response.value);
      return cleanedProperties[0] || null;

    } catch (error: any) {
      console.error(`❌ Error fetching property ${listingKey}:`, error.message);
      throw new Error(`Failed to fetch property: ${error.message}`);
    }
  }

  /**
   * Get property count with filters
   */
  async getPropertyCount(filters: PropertySearchFilters = {}): Promise<number> {
    try {
      const params: Record<string, any> = {};
      
      const filterString = this.buildODataFilter(filters);
      if (filterString) {
        params.$filter = filterString;
      }

      const response = await this.makeAuthenticatedRequest<number>(
        '/odata/Property/$count',
        params
      );

      return typeof response === 'number' ? response : parseInt(String(response), 10);

    } catch (error: any) {
      console.error('❌ Error fetching property count:', error.message);
      throw new Error(`Failed to fetch property count: ${error.message}`);
    }
  }

  /**
   * Get all properties with pagination support
   */
  async getAllPropertiesPaginated(
    filters: PropertySearchFilters = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<TrestleProperty[]> {
    try {
      console.log('🏠 Starting paginated property fetch...');
      
      // First, get the total count
      const totalCount = await this.getPropertyCount(filters);
      console.log(`📊 Total properties to fetch: ${totalCount}`);
      
      const allProperties: TrestleProperty[] = [];
      const pageSize = 500; // Trestle API recommended page size
      let currentPage = 0;
      
      while (allProperties.length < totalCount) {
        const skip = currentPage * pageSize;
        const batchFilters = { ...filters, limit: pageSize, skip };
        
        console.log(`📄 Fetching page ${currentPage + 1} (${skip + 1}-${Math.min(skip + pageSize, totalCount)} of ${totalCount})...`);
        
        const batchProperties = await this.getProperties(batchFilters);
        
        if (batchProperties.length === 0) {
          console.log('🏁 No more properties to fetch');
          break;
        }
        
        allProperties.push(...batchProperties);
        currentPage++;
        
        // Call progress callback
        if (onProgress) {
          onProgress(allProperties.length, totalCount);
        }
        
        // Small delay to avoid overwhelming the API
        await this.delay(100);
      }
      
      console.log(`✅ Completed fetching ${allProperties.length} properties`);
      return allProperties;

    } catch (error: any) {
      console.error('❌ Error in paginated fetch:', error.message);
      throw new Error(`Failed to fetch all properties: ${error.message}`);
    }
  }

  /**
   * Validate and clean property data
   */
  private validateAndCleanProperties(properties: TrestleProperty[]): TrestleProperty[] {
    return properties.map(property => {
      // Clean and validate property data
      const cleaned: TrestleProperty = {
        ListingKey: property.ListingKey || '',
        ListPrice: this.validateNumber(property.ListPrice),
        UnparsedAddress: this.cleanString(property.UnparsedAddress),
        StandardStatus: this.cleanString(property.StandardStatus),
        PropertyType: this.cleanString(property.PropertyType),
        BedroomsTotal: this.validateNumber(property.BedroomsTotal),
        BathroomsTotalInteger: this.validateNumber(property.BathroomsTotalInteger),
        LivingArea: this.validateNumber(property.LivingArea),
        LotSizeAcres: this.validateNumber(property.LotSizeAcres),
        YearBuilt: this.validateYear(property.YearBuilt),
        ListingContractDate: this.validateDate(property.ListingContractDate),
        OnMarketDate: this.validateDate(property.OnMarketDate),
        DaysOnMarket: this.validateNumber(property.DaysOnMarket),
        City: this.cleanString(property.City),
        StateOrProvince: this.cleanString(property.StateOrProvince),
        PostalCode: this.cleanString(property.PostalCode),
        CountyOrParish: this.cleanString(property.CountyOrParish),
        Latitude: this.validateCoordinate(property.Latitude, -90, 90),
        Longitude: this.validateCoordinate(property.Longitude, -180, 180),
        ListAgentName: this.cleanString(property.ListAgentName),
        ListOfficeName: this.cleanString(property.ListOfficeName),
        PublicRemarks: this.cleanString(property.PublicRemarks),
        InternetAddressDisplayYN: property.InternetAddressDisplayYN,
        VirtualTourURLUnbranded: this.validateUrl(property.VirtualTourURLUnbranded),
        Cooling: this.cleanString(property.Cooling),
        Heating: this.cleanString(property.Heating),
        ParkingTotal: this.validateNumber(property.ParkingTotal),
        GarageSpaces: this.validateNumber(property.GarageSpaces),
        WaterSource: this.cleanString(property.WaterSource),
        Sewer: this.cleanString(property.Sewer),
        ElectricOnPropertyYN: property.ElectricOnPropertyYN,
        InternetYN: property.InternetYN,
        CableTvYN: property.CableTvYN,
        SecuritySystemYN: property.SecuritySystemYN,
        Pool: this.cleanString(property.Pool),
        Spa: this.cleanString(property.Spa),
        Fireplace: this.cleanString(property.Fireplace),
        View: this.cleanString(property.View),
        WaterfrontYN: property.WaterfrontYN,
        PetsAllowed: this.cleanString(property.PetsAllowed),
        AssociationFee: this.validateNumber(property.AssociationFee),
        TaxAnnualAmount: this.validateNumber(property.TaxAnnualAmount),
        TaxYear: this.validateYear(property.TaxYear),
        Zoning: this.cleanString(property.Zoning),
        PropertySubType: this.cleanString(property.PropertySubType),
        ArchitecturalStyle: this.cleanString(property.ArchitecturalStyle),
        ConstructionMaterials: this.cleanString(property.ConstructionMaterials),
        RoofMaterial: this.cleanString(property.RoofMaterial),
        FoundationDetails: this.cleanString(property.FoundationDetails),
        InteriorFeatures: this.cleanString(property.InteriorFeatures),
        ExteriorFeatures: this.cleanString(property.ExteriorFeatures),
        Appliances: this.cleanString(property.Appliances),
        LaundryFeatures: this.cleanString(property.LaundryFeatures),
        Utilities: this.cleanString(property.Utilities),
        CommunityFeatures: this.cleanString(property.CommunityFeatures),
      };

      return cleaned;
    }).filter(property => property.ListingKey); // Remove properties without listing keys
  }

  /**
   * Validation helper methods
   */
  private validateNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  private validateYear(value: any): number | undefined {
    const year = this.validateNumber(value);
    if (!year) return undefined;
    const currentYear = new Date().getFullYear();
    return year >= 1800 && year <= currentYear + 5 ? year : undefined;
  }

  private validateCoordinate(value: any, min: number, max: number): number | undefined {
    const coord = this.validateNumber(value);
    if (!coord) return undefined;
    return coord >= min && coord <= max ? coord : undefined;
  }

  private validateDate(value: any): string | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : value;
  }

  private validateUrl(value: any): string | undefined {
    if (!value) return undefined;
    try {
      new URL(value);
      return value;
    } catch {
      return undefined;
    }
  }

  private cleanString(value: any): string | undefined {
    if (!value || typeof value !== 'string') return undefined;
    const cleaned = value.trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      await this.getAccessToken();
      
      // Try to fetch one property to verify API access
      await this.getProperties({ limit: 1 });
      
      return {
        status: 'healthy',
        message: 'Trestle API is accessible and authentication is working'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Trestle API health check failed: ${error.message}`
      };
    }
  }
}

// Export a singleton instance
export const trestleAPI = new TrestleAPIService();
