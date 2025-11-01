import { NextRequest, NextResponse } from 'next/server';
import { getPropertyVectorSearch } from '../../../../lib/vector-search';
import crypto from 'crypto';
import { PropertyDataValidator } from '../../../../lib/data-validation';

const vectorSearch = getPropertyVectorSearch();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { properties } = body;

    if (!properties || !Array.isArray(properties)) {
      return NextResponse.json(
        { success: false, error: 'Properties array is required' },
        { status: 400 }
      );
    }

  // Compute listing key signature upfront for idempotence & in-progress detection

    // Normalize incoming properties from Postgres shape to Trestle-like fields expected by validator
    const normalized = properties.map((p: any) => ({
      ListingKey: p.ListingKey || p.listing_key || p.id,
      ListPrice: p.ListPrice || p.list_price,
      BedroomsTotal: p.BedroomsTotal || p.bedrooms,
      BathroomsTotalInteger: p.BathroomsTotalInteger || p.bathrooms || p.bathrooms_total,
      LivingArea: p.LivingArea || p.living_area || p.living_area_sqft || p.living_area_sq_ft,
      LotSizeSquareFeet: p.LotSizeSquareFeet || p.lot_size_sq_ft || p.lot_size_sqft,
      City: p.City || p.city,
      StateOrProvince: p.StateOrProvince || p.state || p.state_or_province,
      PropertyType: p.PropertyType || p.property_type,
      PropertySubType: p.PropertySubType || p.property_sub_type,
      PoolPrivateYN: p.PoolPrivateYN || p.pool_private_yn || p.pool,
      WaterfrontYN: p.WaterfrontYN || p.waterfront_yn,
      ViewYN: p.ViewYN || p.view_yn || !!p.view,
      PublicRemarks: p.PublicRemarks || p.publicRemarks || p.public_remarks,
      Latitude: p.Latitude || p.latitude,
      Longitude: p.Longitude || p.longitude,
      YearBuilt: p.YearBuilt || p.year_built,
      ModificationTimestamp: p.ModificationTimestamp || p.modification_ts,
      ListingContractDate: p.ListingContractDate || p.first_seen_ts,
      GarageSpaces: p.GarageSpaces || p.garage_spaces,
      FireplacesTotal: p.FireplacesTotal || p.fireplaces_total,
    }));

    // Validate and clean properties
    const validation = PropertyDataValidator.batchValidateProperties(normalized as any);
    
    if (validation.validProperties.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid properties to index' },
        { status: 400 }
      );
    }

    // Determine signature for idempotence (using validated listing keys)
    const listingKeys = validation.validProperties.map(p => p.ListingKey).sort();
    const signature = crypto.createHash('sha256').update(listingKeys.join('|')).digest('hex');

    if (vectorSearch.hasSignatureForListingKeys(listingKeys)) {
      const existingStats = vectorSearch.getIndexStats();
      return NextResponse.json({
        success: true,
        data: {
          skipped: true,
          reason: 'Already indexed with identical listing set',
          stats: existingStats
        }
      });
    }

    if (vectorSearch.isIndexingSignature(listingKeys)) {
      const existingStats = vectorSearch.getIndexStats();
      return NextResponse.json({
        success: true,
        data: {
          skipped: true,
          reason: 'Index build already in progress for this signature',
          stats: existingStats
        }
      });
    }

    // Index properties (suppress internal logs so we control output here)
    try {
      vectorSearch.indexProperties(validation.validProperties, signature, { suppressLog: true });
    } catch (ve: any) {
      console.warn('Vector index internal error (continuing):', ve?.message);
    }

    const stats = vectorSearch.getIndexStats();
    console.log(`🔍 Indexed ${validation.validProperties.length} properties (vocab terms=${stats.vocabularySize})`);
    return NextResponse.json({
      success: true,
      data: {
        indexedProperties: validation.validProperties.length,
        invalidProperties: validation.invalidProperties.length,
        stats,
        summary: validation.summary,
        signature
      }
    });

  } catch (error: any) {
    console.error('❌ Vector indexing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to index properties',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = vectorSearch.getIndexStats();
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        isIndexed: stats.totalProperties > 0
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting vector index stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get vector index stats',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
