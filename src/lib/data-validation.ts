import { TrestleProperty } from './trestle-api';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CleanedProperty extends TrestleProperty {
  // Additional computed fields
  cleanedAddress?: string;
  pricePerSqFt?: number;
  isLuxury?: boolean;
  searchKeywords?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export class PropertyDataValidator {
  
  /**
   * Validate a single property
   */
  static validateProperty(property: TrestleProperty): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!property.ListingKey) {
      errors.push('ListingKey is required');
    }

    if (!property.StandardStatus) {
      warnings.push('StandardStatus is missing');
    }

    // Price validation (more permissive)
    if (property.ListPrice !== undefined && property.ListPrice !== null) {
      if (property.ListPrice < 0) {
        errors.push('ListPrice cannot be negative');
      }
      if (property.ListPrice > 1000000000) { // $1B
        warnings.push('ListPrice seems unusually high');
      }
    }

    // Area validation (more permissive)
    if (property.LivingArea !== undefined && property.LivingArea !== null) {
      if (property.LivingArea < 0) {
        errors.push('LivingArea cannot be negative');
      }
      if (property.LivingArea > 50000) { // 50k sq ft
        warnings.push('LivingArea seems unusually large');
      }
    }

    // Bedroom/bathroom validation
    if (property.BedroomsTotal !== undefined && property.BedroomsTotal < 0) {
      errors.push('BedroomsTotal cannot be negative');
    }

    if (property.BathroomsTotalInteger !== undefined && property.BathroomsTotalInteger < 0) {
      errors.push('BathroomsTotalInteger cannot be negative');
    }

    // Year built validation (more permissive)
    if (property.YearBuilt !== undefined && property.YearBuilt !== null && property.YearBuilt > 0) {
      const currentYear = new Date().getFullYear();
      if (property.YearBuilt < 1700 || property.YearBuilt > currentYear + 5) {
        warnings.push('YearBuilt seems unusual - may need verification');
      }
    }

    // Geographic validation
    if (property.Latitude !== undefined) {
      if (property.Latitude < -90 || property.Latitude > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
    }

    if (property.Longitude !== undefined) {
      if (property.Longitude < -180 || property.Longitude > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }

    // Date validation
    if (property.ListingContractDate) {
      const date = new Date(property.ListingContractDate);
      if (isNaN(date.getTime())) {
        errors.push('ListingContractDate is not a valid date');
      }
    }

    if (property.ModificationTimestamp) {
      const date = new Date(property.ModificationTimestamp);
      if (isNaN(date.getTime())) {
        errors.push('ModificationTimestamp is not a valid date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clean and enhance property data
   */
  static cleanProperty(property: TrestleProperty): CleanedProperty {
    const cleaned: CleanedProperty = { ...property };

    // Clean address
    if (property.UnparsedAddress) {
      cleaned.cleanedAddress = this.cleanAddress(property.UnparsedAddress);
    }

    // Calculate price per square foot
    if (property.ListPrice && property.LivingArea && property.LivingArea > 0) {
      cleaned.pricePerSqFt = Math.round(property.ListPrice / property.LivingArea);
    }

    // Determine if luxury property
    cleaned.isLuxury = this.isLuxuryProperty(property);

    // Generate search keywords
    cleaned.searchKeywords = this.generateSearchKeywords(property);

    // Normalize coordinates
    if (property.Latitude && property.Longitude) {
      cleaned.coordinates = {
        lat: Number(property.Latitude),
        lng: Number(property.Longitude)
      };
    }

    // Clean numeric fields
    if (property.ListPrice) {
      cleaned.ListPrice = Number(property.ListPrice);
    }

    if (property.LivingArea) {
      cleaned.LivingArea = Number(property.LivingArea);
    }

    if (property.LotSizeSquareFeet) {
      cleaned.LotSizeSquareFeet = Number(property.LotSizeSquareFeet);
    }

    // Clean string fields
    if (property.City) {
      cleaned.City = this.capitalizeWords(property.City.trim());
    }

    if (property.StateOrProvince) {
      cleaned.StateOrProvince = property.StateOrProvince.trim().toUpperCase();
    }

    if (property.PropertyType) {
      cleaned.PropertyType = this.capitalizeWords(property.PropertyType.trim());
    }

    // Clean boolean fields
    cleaned.PoolPrivateYN = Boolean(property.PoolPrivateYN);
    cleaned.WaterfrontYN = Boolean(property.WaterfrontYN);
    cleaned.ViewYN = Boolean(property.ViewYN);

    return cleaned;
  }

  /**
   * Clean address string
   */
  private static cleanAddress(address: string): string {
    return address
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/,\s*,/g, ',') // Remove duplicate commas
      .split(' ')
      .map(word => this.capitalizeWords(word))
      .join(' ');
  }

  /**
   * Determine if property is luxury
   */
  private static isLuxuryProperty(property: TrestleProperty): boolean {
    const luxuryIndicators = [
      property.ListPrice && property.ListPrice > 1000000, // Over $1M
      property.LivingArea && property.LivingArea > 4000, // Over 4000 sq ft
      property.BedroomsTotal && property.BedroomsTotal >= 5, // 5+ bedrooms
      property.BathroomsTotalInteger && property.BathroomsTotalInteger >= 4, // 4+ bathrooms
      property.PoolPrivateYN,
      property.WaterfrontYN,
      property.ViewYN,
      property.PropertyType?.toLowerCase().includes('luxury'),
      property.PropertySubType?.toLowerCase().includes('luxury'),
      property.PublicRemarks?.toLowerCase().includes('luxury')
    ];

    return luxuryIndicators.filter(Boolean).length >= 3;
  }

  /**
   * Generate search keywords for property
   */
  private static generateSearchKeywords(property: TrestleProperty): string[] {
    const keywords: string[] = [];

    // Basic property info
    if (property.PropertyType) {
      keywords.push(property.PropertyType.toLowerCase());
    }

    if (property.PropertySubType) {
      keywords.push(property.PropertySubType.toLowerCase());
    }

    // Location
    if (property.City) {
      keywords.push(property.City.toLowerCase());
    }

    if (property.StateOrProvince) {
      keywords.push(property.StateOrProvince.toLowerCase());
    }

    // Features
    if (property.PoolPrivateYN) {
      keywords.push('pool', 'swimming pool');
    }

    if (property.WaterfrontYN) {
      keywords.push('waterfront', 'water view');
    }

    if (property.ViewYN) {
      keywords.push('view', 'scenic view');
    }

    if (property.GarageSpaces && property.GarageSpaces > 0) {
      keywords.push('garage');
    }

    if (property.FireplacesTotal && property.FireplacesTotal > 0) {
      keywords.push('fireplace');
    }

    // Size categories
    if (property.BedroomsTotal) {
      keywords.push(`${property.BedroomsTotal} bedroom`);
      keywords.push(`${property.BedroomsTotal}br`);
    }

    if (property.BathroomsTotalInteger) {
      keywords.push(`${property.BathroomsTotalInteger} bathroom`);
      keywords.push(`${property.BathroomsTotalInteger}ba`);
    }

    // Price range
    if (property.ListPrice) {
      if (property.ListPrice < 200000) {
        keywords.push('affordable', 'budget');
      } else if (property.ListPrice > 1000000) {
        keywords.push('luxury', 'premium', 'high-end');
      }
    }

    // Extract keywords from remarks
    if (property.PublicRemarks) {
      const remarkKeywords = this.extractKeywordsFromText(property.PublicRemarks);
      keywords.push(...remarkKeywords);
    }

    // Remove duplicates and return
    return [...new Set(keywords)];
  }

  /**
   * Extract keywords from text
   */
  private static extractKeywordsFromText(text: string): string[] {
    const importantWords = [
      'updated', 'renovated', 'modern', 'new', 'stunning', 'beautiful',
      'spacious', 'open', 'gourmet', 'granite', 'hardwood', 'tile',
      'stainless', 'appliances', 'cathedral', 'vaulted', 'master',
      'walk-in', 'ensuite', 'deck', 'patio', 'landscaped', 'fenced',
      'corner', 'lot', 'quiet', 'cul-de-sac', 'near', 'close',
      'schools', 'shopping', 'transportation', 'downtown'
    ];

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    return words.filter(word => importantWords.includes(word));
  }

  /**
   * Capitalize words properly
   */
  private static capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Batch validate properties
   */
  static batchValidateProperties(properties: TrestleProperty[]): {
    validProperties: CleanedProperty[];
    invalidProperties: { property: TrestleProperty; validation: ValidationResult }[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      withWarnings: number;
    };
  } {
    const validProperties: CleanedProperty[] = [];
    const invalidProperties: { property: TrestleProperty; validation: ValidationResult }[] = [];
    let withWarnings = 0;

    for (const property of properties) {
      const validation = this.validateProperty(property);
      
      if (validation.isValid) {
        const cleaned = this.cleanProperty(property);
        validProperties.push(cleaned);
        
        if (validation.warnings.length > 0) {
          withWarnings++;
        }
      } else {
        invalidProperties.push({ property, validation });
      }
    }

    return {
      validProperties,
      invalidProperties,
      summary: {
        total: properties.length,
        valid: validProperties.length,
        invalid: invalidProperties.length,
        withWarnings
      }
    };
  }
}
