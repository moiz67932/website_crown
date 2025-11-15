import { NextRequest, NextResponse } from 'next/server';
import { createTrestleApiService } from '@/lib/trestle-service';
import { TrestleProperty } from '@/lib/trestle-api';

const trestleApi = createTrestleApiService();

// Function to convert Trestle property to app format (CANONICAL field names)
function convertTrestleToAppFormat(trestleProperty: TrestleProperty) {
  // Handle property images - use Photos array if available, otherwise generate sample image URLs
  let photos: string[];
  let mainImage: string;
  
  if (trestleProperty.Photos && trestleProperty.Photos.length > 0) {
    // Use real photos if available
    photos = trestleProperty.Photos;
    mainImage = photos[0];
  } else {
    // Generate sample property images using a free service for demonstration
    const imageId = parseInt(trestleProperty.ListingKey.slice(-3)) % 20 + 1;
    const sampleImages = [
      `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=house`,
      `https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop&crop=house`,
      `https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop&crop=house`
    ];
    photos = [sampleImages[imageId % sampleImages.length]];
    mainImage = photos[0];
  }
  
  // CANONICAL: Use exact field names from PropertyDetail interface
  return {
    // Primary identifiers
    _id: trestleProperty.ListingKey,
    id: trestleProperty.ListingKey,
    listing_key: trestleProperty.ListingKey,
    
    // Pricing - CANONICAL
    list_price: trestleProperty.ListPrice || 0,
    
    // Location - CANONICAL field names
    address: trestleProperty.UnparsedAddress || "Address not available",
    city: trestleProperty.City || "",
    county: trestleProperty.StateOrProvince || "", // CANONICAL: county contains state
    postal_code: trestleProperty.PostalCode || "",
    latitude: trestleProperty.Latitude || 0,
    longitude: trestleProperty.Longitude || 0,
    
    // Property characteristics - CANONICAL field names
    property_type: trestleProperty.PropertyType || "Residential",
    bedrooms: trestleProperty.BedroomsTotal || null, // CANONICAL: bedrooms (not BedroomsTotal)
    bathrooms: trestleProperty.BathroomsTotalInteger || null, // CANONICAL: bathrooms
    living_area_sqft: trestleProperty.LivingArea || null, // CANONICAL: living_area_sqft
    lot_size_sqft: trestleProperty.LotSizeAcres ? trestleProperty.LotSizeAcres * 43560 : 0,
    year_built: trestleProperty.YearBuilt,
    
    // Images - CANONICAL
    images: photos,
    main_image_url: mainImage,
    image: mainImage, // Legacy support
    
    // Status and metadata
    status: trestleProperty.StandardStatus === "Active" ? "FOR SALE" : (trestleProperty.StandardStatus || "UNKNOWN"),
    statusColor: trestleProperty.StandardStatus === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
    days_on_market: trestleProperty.DaysOnMarket,
    
    // Descriptions - CANONICAL
    public_remarks: trestleProperty.PublicRemarks || "",
    
    // Additional fields
    photosCount: trestleProperty.PhotosCount || 0,
    favorite: false,
    createdAt: trestleProperty.OnMarketDate || new Date().toISOString(),
    updatedAt: trestleProperty.OnMarketDate || new Date().toISOString(),
    
    // Legacy fields for backward compatibility
    location: trestleProperty.City || "Unknown",
    state: trestleProperty.StateOrProvince || "",
    zip_code: trestleProperty.PostalCode || "",
    publicRemarks: trestleProperty.PublicRemarks || "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 10, filters = {} } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    console.log(`🔍 Semantic search for: "${query}"`);

    // Build Trestle API filters based on semantic query
    const trestleFilters: any = {
      '$top': limit,
      '$orderby': 'OnMarketDate desc',
      '$filter': ['StandardStatus eq \'Active\'']
    };

    // Parse query for semantic meaning and add filters
    const lowerQuery = query.toLowerCase();
    
    // Price-based filtering
    if (lowerQuery.includes('luxury') || lowerQuery.includes('expensive') || lowerQuery.includes('high-end')) {
      trestleFilters['$filter'].push('ListPrice gt 500000');
    } else if (lowerQuery.includes('affordable') || lowerQuery.includes('cheap') || lowerQuery.includes('budget')) {
      trestleFilters['$filter'].push('ListPrice lt 300000');
    }
    
    // Property type filtering
    if (lowerQuery.includes('condo') || lowerQuery.includes('condominium')) {
      trestleFilters['$filter'].push('PropertyType eq \'Condominium\'');
    } else if (lowerQuery.includes('house') || lowerQuery.includes('home') || lowerQuery.includes('single family')) {
      trestleFilters['$filter'].push('PropertyType eq \'Residential\'');
    }
    
    // Feature-based filtering - use text search in PublicRemarks instead of boolean fields
    if (lowerQuery.includes('waterfront') || lowerQuery.includes('ocean') || lowerQuery.includes('beach')) {
      trestleFilters['$filter'].push('(contains(tolower(PublicRemarks), \'waterfront\') or contains(tolower(PublicRemarks), \'ocean\') or contains(tolower(PublicRemarks), \'beach\'))');
    }
    
    if (lowerQuery.includes('pool')) {
      trestleFilters['$filter'].push('contains(tolower(PublicRemarks), \'pool\')');
    }
    
    if (lowerQuery.includes('view')) {
      trestleFilters['$filter'].push('contains(tolower(PublicRemarks), \'view\')');
    }

    // Location-based search
    const cityMatch = lowerQuery.match(/in\s+([a-zA-Z\s]+)/);
    if (cityMatch) {
      const city = cityMatch[1].trim();
      trestleFilters['$filter'].push(`contains(tolower(City), '${city.toLowerCase()}')`);
    }

    // General text search - if no specific filters were added, search in multiple fields
    const hasSpecificFilters = trestleFilters['$filter'].length > 1; // More than just StandardStatus
    if (!hasSpecificFilters) {
      // Search in multiple text fields for general queries
      const searchTerms = lowerQuery.split(' ').filter(term => term.length > 2);
      if (searchTerms.length > 0) {
        // Create a simple text search in PublicRemarks and City
        const term = searchTerms[0]; // Use first meaningful term
        trestleFilters['$filter'].push(`(contains(tolower(PublicRemarks), '${term}') or contains(tolower(City), '${term}'))`);
      }
    }

    // Combine filters
    trestleFilters['$filter'] = trestleFilters['$filter'].join(' and ');

    console.log('🔍 Trestle semantic search filters:', trestleFilters);

    // Fetch from Trestle API
    const trestleProperties = await trestleApi.getAllProperties(trestleFilters, limit);
    
    console.log(`✅ Found ${trestleProperties.length} semantic matches from Trestle API`);

    // Convert to app format with proper images
    const convertedProperties = trestleProperties.map(convertTrestleToAppFormat);

    return NextResponse.json({
      success: true,
      data: convertedProperties,
      meta: {
        totalResults: convertedProperties.length,
        searchQuery: query,
        searchTime: Date.now()
      }
    });

  } catch (error: any) {
    console.error('❌ Error in semantic search:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform semantic search',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Use the same logic as POST
    return await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ query, limit })
    }));

  } catch (error: any) {
    console.error('❌ Error in semantic search GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform semantic search',
        message: error.message 
      },
      { status: 500 }
    );
  }
}