import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CleanedProperty } from './data-validation';

export interface PropertySearchQuery {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  propertyType?: string;
  hasPool?: boolean;
  isWaterfront?: boolean;
  hasView?: boolean;
  keywords?: string[];
  limit?: number;
  offset?: number;
}

export interface PropertySearchResult {
  properties: CleanedProperty[];
  total: number;
  hasMore: boolean;
}

export class PropertyDatabase {
  private db: any;
  private dbPath: string;

  constructor(dbPath: string = './data/properties.db') {
    this.dbPath = dbPath;
    
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeTables();
    this.createIndexes();
  }

  /**
   * Initialize database tables
   */
  private initializeTables(): void {
    // Properties table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_key TEXT UNIQUE NOT NULL,
        list_price REAL,
        unparsed_address TEXT,
        cleaned_address TEXT,
        standard_status TEXT,
        property_type TEXT,
        property_sub_type TEXT,
        bedrooms_total INTEGER,
        bathrooms_total INTEGER,
        living_area REAL,
        lot_size_sq_ft REAL,
        year_built INTEGER,
        listing_contract_date TEXT,
        modification_timestamp TEXT,
        on_market_date TEXT,
        city TEXT,
        state_or_province TEXT,
        postal_code TEXT,
        country TEXT,
        latitude REAL,
        longitude REAL,
        listing_id TEXT,
        mls_status TEXT,
        photos_count INTEGER,
        public_remarks TEXT,
        private_remarks TEXT,
        list_agent_full_name TEXT,
        list_office_name TEXT,
        parking_total INTEGER,
        garage_spaces INTEGER,
        fireplaces_total INTEGER,
        pool_private_yn BOOLEAN,
        waterfront_yn BOOLEAN,
        view_yn BOOLEAN,
        cooling_yn BOOLEAN,
        heating_yn BOOLEAN,
        internet_yn BOOLEAN,
        spa_yn BOOLEAN,
        days_on_market INTEGER,
        original_list_price REAL,
        price_change_timestamp TEXT,
        close_date TEXT,
        close_price REAL,
        cumulative_days_on_market INTEGER,
        association_fee REAL,
        tax_annual_amount REAL,
        walk_score REAL,
        school_district_name TEXT,
        elementary_school_name TEXT,
        middle_school_name TEXT,
        high_school_name TEXT,
        price_per_sq_ft REAL,
        is_luxury BOOLEAN,
        search_keywords TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sync log table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_date TEXT NOT NULL,
        properties_fetched INTEGER,
        properties_inserted INTEGER,
        properties_updated INTEGER,
        properties_deleted INTEGER,
        errors TEXT,
        duration_ms INTEGER,
        status TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API health log
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_health_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        check_date TEXT NOT NULL,
        is_healthy BOOLEAN,
        total_properties INTEGER,
        active_properties INTEGER,
        response_time_ms INTEGER,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Create database indexes for better performance
   */
  private createIndexes(): void {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_listing_key ON properties(listing_key)',
      'CREATE INDEX IF NOT EXISTS idx_city ON properties(city)',
      'CREATE INDEX IF NOT EXISTS idx_state ON properties(state_or_province)',
      'CREATE INDEX IF NOT EXISTS idx_price ON properties(list_price)',
      'CREATE INDEX IF NOT EXISTS idx_bedrooms ON properties(bedrooms_total)',
      'CREATE INDEX IF NOT EXISTS idx_bathrooms ON properties(bathrooms_total)',
      'CREATE INDEX IF NOT EXISTS idx_property_type ON properties(property_type)',
      'CREATE INDEX IF NOT EXISTS idx_standard_status ON properties(standard_status)',
      'CREATE INDEX IF NOT EXISTS idx_coordinates ON properties(latitude, longitude)',
      'CREATE INDEX IF NOT EXISTS idx_modification_timestamp ON properties(modification_timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_luxury ON properties(is_luxury)',
      'CREATE INDEX IF NOT EXISTS idx_features ON properties(pool_private_yn, waterfront_yn, view_yn)'
    ];

    indexes.forEach(indexSql => {
      this.db.exec(indexSql);
    });
  }

  /**
   * Insert or update properties
   */
  async upsertProperties(properties: CleanedProperty[]): Promise<{
    inserted: number;
    updated: number;
    errors: string[];
  }> {
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO properties (
        listing_key, list_price, unparsed_address, cleaned_address, standard_status,
        property_type, property_sub_type, bedrooms_total, bathrooms_total,
        living_area, lot_size_sq_ft, year_built, listing_contract_date,
        modification_timestamp, on_market_date, city, state_or_province,
        postal_code, country, latitude, longitude, listing_id, mls_status,
        photos_count, public_remarks, private_remarks, list_agent_full_name,
        list_office_name, parking_total, garage_spaces, fireplaces_total,
        pool_private_yn, waterfront_yn, view_yn, cooling_yn, heating_yn,
        internet_yn, spa_yn, days_on_market, original_list_price,
        price_change_timestamp, close_date, close_price, cumulative_days_on_market,
        association_fee, tax_annual_amount, walk_score, school_district_name,
        elementary_school_name, middle_school_name, high_school_name,
        price_per_sq_ft, is_luxury, search_keywords, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
    `);

    const checkExistingStmt = this.db.prepare('SELECT listing_key FROM properties WHERE listing_key = ?');

    const transaction = this.db.transaction((properties: CleanedProperty[]) => {
      for (const property of properties) {
        try {
          const p: any = property as any;
          const exists = checkExistingStmt.get(p.ListingKey);
          
          insertStmt.run(
            p.ListingKey,
            p.ListPrice || null,
            p.UnparsedAddress || null,
            p.cleanedAddress || null,
            p.StandardStatus || null,
            p.PropertyType || null,
            p.PropertySubType || null,
            p.BedroomsTotal || null,
            p.BathroomsTotalInteger || null,
            p.LivingArea || null,
            p.LotSizeSquareFeet || null,
            p.YearBuilt || null,
            p.ListingContractDate || null,
            p.ModificationTimestamp || null,
            p.OnMarketDate || null,
            p.City || null,
            p.StateOrProvince || null,
            p.PostalCode || null,
            p.Country || null,
            p.Latitude || null,
            p.Longitude || null,
            p.ListingId || null,
            p.MlsStatus || null,
            p.PhotosCount || null,
            p.PublicRemarks || null,
            p.PrivateRemarks || null,
            p.ListAgentFullName || null,
            p.ListOfficeName || null,
            p.ParkingTotal || null,
            p.GarageSpaces || null,
            p.FireplacesTotal || null,
            p.PoolPrivateYN ? 1 : 0,
            p.WaterfrontYN ? 1 : 0,
            p.ViewYN ? 1 : 0,
            p.CoolingYN ? 1 : 0,
            p.HeatingYN ? 1 : 0,
            p.InternetYN ? 1 : 0,
            p.SpaYN ? 1 : 0,
            p.DaysOnMarket || null,
            p.OriginalListPrice || null,
            p.PriceChangeTimestamp || null,
            p.CloseDate || null,
            p.ClosePrice || null,
            p.CumulativeDaysOnMarket || null,
            p.AssociationFee || null,
            p.TaxAnnualAmount || null,
            p.WalkScore || null,
            p.SchoolDistrictName || null,
            p.ElementarySchoolName || null,
            p.MiddleOrJuniorSchoolName || null,
            p.HighSchoolName || null,
            p.pricePerSqFt || null,
            p.isLuxury ? 1 : 0,
            p.searchKeywords ? JSON.stringify(p.searchKeywords) : null
          );

          if (exists) {
            updated++;
          } else {
            inserted++;
          }
        } catch (error: any) {
          errors.push(`Error inserting property ${property.ListingKey}: ${error.message}`);
        }
      }
    });

    transaction(properties);

    return { inserted, updated, errors };
  }

  /**
   * Search properties with advanced filtering
   */
  searchProperties(query: PropertySearchQuery): PropertySearchResult {
    let sql = `
      SELECT * FROM properties 
      WHERE standard_status = 'Active'
        AND LOWER(property_type) <> 'land'
    `;
    const params: any[] = [];

    // Add filters
    if (query.city) {
      sql += ` AND LOWER(city) LIKE LOWER(?)`;
      params.push(`%${query.city}%`);
    }

    if (query.state) {
      sql += ` AND LOWER(state_or_province) = LOWER(?)`;
      params.push(query.state);
    }

    if (query.minPrice !== undefined) {
      sql += ` AND list_price >= ?`;
      params.push(query.minPrice);
    }

    if (query.maxPrice !== undefined) {
      sql += ` AND list_price <= ?`;
      params.push(query.maxPrice);
    }

    if (query.minBedrooms !== undefined) {
      sql += ` AND bedrooms_total >= ?`;
      params.push(query.minBedrooms);
    }

    if (query.maxBedrooms !== undefined) {
      sql += ` AND bedrooms_total <= ?`;
      params.push(query.maxBedrooms);
    }

    if (query.minBathrooms !== undefined) {
      sql += ` AND bathrooms_total >= ?`;
      params.push(query.minBathrooms);
    }

    if (query.maxBathrooms !== undefined) {
      sql += ` AND bathrooms_total <= ?`;
      params.push(query.maxBathrooms);
    }

    if (query.propertyType) {
      sql += ` AND LOWER(property_type) LIKE LOWER(?)`;
      params.push(`%${query.propertyType}%`);
    }

    if (query.hasPool !== undefined) {
      sql += ` AND pool_private_yn = ?`;
      params.push(query.hasPool ? 1 : 0);
    }

    if (query.isWaterfront !== undefined) {
      sql += ` AND waterfront_yn = ?`;
      params.push(query.isWaterfront ? 1 : 0);
    }

    if (query.hasView !== undefined) {
      sql += ` AND view_yn = ?`;
      params.push(query.hasView ? 1 : 0);
    }

    // Keyword search
    if (query.keywords && query.keywords.length > 0) {
      const keywordConditions = query.keywords.map(() => 
        '(LOWER(search_keywords) LIKE LOWER(?) OR LOWER(public_remarks) LIKE LOWER(?) OR LOWER(cleaned_address) LIKE LOWER(?))'
      ).join(' AND ');
      sql += ` AND (${keywordConditions})`;
      
      query.keywords.forEach(keyword => {
        const likeParam = `%${keyword}%`;
        params.push(likeParam, likeParam, likeParam);
      });
    }

    // Count total results
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const totalResult = this.db.prepare(countSql).get(...params) as { 'COUNT(*)': number };
    const total = totalResult['COUNT(*)'];

    // Add ordering and pagination
    sql += ` ORDER BY modification_timestamp DESC`;
    
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute search
    const properties = this.db.prepare(sql).all(...params) as any[];

    // Convert database rows back to CleanedProperty objects
    const cleanedProperties: CleanedProperty[] = properties.map(row => ({
      ListingKey: row.listing_key,
      ListPrice: row.list_price,
      UnparsedAddress: row.unparsed_address,
      cleanedAddress: row.cleaned_address,
      StandardStatus: row.standard_status,
      PropertyType: row.property_type,
      PropertySubType: row.property_sub_type,
      BedroomsTotal: row.bedrooms_total,
      BathroomsTotalInteger: row.bathrooms_total,
      LivingArea: row.living_area,
      LotSizeSquareFeet: row.lot_size_sq_ft,
      YearBuilt: row.year_built,
      ListingContractDate: row.listing_contract_date,
      ModificationTimestamp: row.modification_timestamp,
      OnMarketDate: row.on_market_date,
      City: row.city,
      StateOrProvince: row.state_or_province,
      PostalCode: row.postal_code,
      Country: row.country,
      Latitude: row.latitude,
      Longitude: row.longitude,
      ListingId: row.listing_id,
      MlsStatus: row.mls_status,
      PhotosCount: row.photos_count,
      PublicRemarks: row.public_remarks,
      PrivateRemarks: row.private_remarks,
      ListAgentFullName: row.list_agent_full_name,
      ListOfficeName: row.list_office_name,
      ParkingTotal: row.parking_total,
      GarageSpaces: row.garage_spaces,
      FireplacesTotal: row.fireplaces_total,
      PoolPrivateYN: Boolean(row.pool_private_yn),
      WaterfrontYN: Boolean(row.waterfront_yn),
      ViewYN: Boolean(row.view_yn),
      CoolingYN: Boolean(row.cooling_yn),
      HeatingYN: Boolean(row.heating_yn),
      InternetYN: Boolean(row.internet_yn),
      SpaYN: Boolean(row.spa_yn),
      DaysOnMarket: row.days_on_market,
      OriginalListPrice: row.original_list_price,
      PriceChangeTimestamp: row.price_change_timestamp,
      CloseDate: row.close_date,
      ClosePrice: row.close_price,
      CumulativeDaysOnMarket: row.cumulative_days_on_market,
      AssociationFee: row.association_fee,
      TaxAnnualAmount: row.tax_annual_amount,
      WalkScore: row.walk_score,
      SchoolDistrictName: row.school_district_name,
      ElementarySchoolName: row.elementary_school_name,
      MiddleOrJuniorSchoolName: row.middle_school_name,
      HighSchoolName: row.high_school_name,
      pricePerSqFt: row.price_per_sq_ft,
      isLuxury: Boolean(row.is_luxury),
      searchKeywords: row.search_keywords ? JSON.parse(row.search_keywords) : [],
      coordinates: row.latitude && row.longitude ? {
        lat: row.latitude,
        lng: row.longitude
      } : undefined
    }));

    return {
      properties: cleanedProperties,
      total,
      hasMore: offset + limit < total
    };
  }

  /**
   * Get property by listing key
   */
  getPropertyByListingKey(listingKey: string): CleanedProperty | null {
    const result = this.searchProperties({ 
      keywords: [listingKey],
      limit: 1 
    });
    
    return result.properties.length > 0 ? result.properties[0] : null;
  }

  /**
   * Get database statistics
   */
  getStats(): {
    totalProperties: number;
    activeProperties: number;
    luxuryProperties: number;
    cities: number;
    states: number;
    lastUpdate: string | null;
  } {
    const totalProperties = this.db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };
    const activeProperties = this.db.prepare("SELECT COUNT(*) as count FROM properties WHERE standard_status = 'Active'").get() as { count: number };
    const luxuryProperties = this.db.prepare('SELECT COUNT(*) as count FROM properties WHERE is_luxury = 1').get() as { count: number };
    const cities = this.db.prepare('SELECT COUNT(DISTINCT city) as count FROM properties WHERE city IS NOT NULL').get() as { count: number };
    const states = this.db.prepare('SELECT COUNT(DISTINCT state_or_province) as count FROM properties WHERE state_or_province IS NOT NULL').get() as { count: number };
    const lastUpdate = this.db.prepare('SELECT MAX(updated_at) as last_update FROM properties').get() as { last_update: string | null };

    return {
      totalProperties: totalProperties.count,
      activeProperties: activeProperties.count,
      luxuryProperties: luxuryProperties.count,
      cities: cities.count,
      states: states.count,
      lastUpdate: lastUpdate.last_update
    };
  }

  /**
   * Log sync operation
   */
  logSync(log: {
    syncDate: string;
    propertiesFetched: number;
    propertiesInserted: number;
    propertiesUpdated: number;
    propertiesDeleted?: number;
    errors?: string[];
    durationMs: number;
    status: 'success' | 'partial' | 'failed';
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO sync_log (
        sync_date, properties_fetched, properties_inserted, 
        properties_updated, properties_deleted, errors, 
        duration_ms, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      log.syncDate,
      log.propertiesFetched,
      log.propertiesInserted,
      log.propertiesUpdated,
      log.propertiesDeleted || 0,
      log.errors ? JSON.stringify(log.errors) : null,
      log.durationMs,
      log.status
    );
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
