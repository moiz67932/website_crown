import { NextRequest, NextResponse } from 'next/server';
import { createTrestleApiService } from '@/lib/trestle-service';
import { TrestleProperty } from '@/lib/trestle-api';

// Create Trestle API service instance
const trestleApi = createTrestleApiService();

// Function to convert Trestle property to app format
// Function to geocode address if coordinates are missing
async function geocodeAddress(address: string, city: string, state: string, postalCode: string): Promise<{lat: number, lng: number} | null> {
  try {
    // Build full address string
    const fullAddress = [address, city, state, postalCode].filter(Boolean).join(', ');
    
    if (!fullAddress.trim()) {
      return null;
    }

    // Use a free geocoding service (OpenStreetMap Nominatim)
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Real Estate App'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return null;
  }
}

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
  
  return {
    id: trestleProperty.ListingKey,
    listing_key: trestleProperty.ListingKey,
    image: mainImage,
    property_type: trestleProperty.PropertyType || "Residential",
    address: trestleProperty.UnparsedAddress || "Address not available",
    location: trestleProperty.City || "Unknown",
    county: trestleProperty.StateOrProvince || "",
    list_price: trestleProperty.ListPrice || 0,
    bedrooms: trestleProperty.BedroomsTotal || 0,
    bathrooms: trestleProperty.BathroomsTotalInteger || 0,
    living_area_sqft: trestleProperty.LivingArea || 0,
    lot_size_sqft: trestleProperty.LotSizeAcres ? trestleProperty.LotSizeAcres * 43560 : 0,
    status: trestleProperty.StandardStatus === "Active" ? "FOR SALE" : (trestleProperty.StandardStatus || "UNKNOWN"),
    statusColor: trestleProperty.StandardStatus === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
    publicRemarks: trestleProperty.PublicRemarks || "",
    favorite: false,
    _id: trestleProperty.ListingKey,
    images: photos,
    main_image_url: mainImage,
    photosCount: trestleProperty.PhotosCount || 0,
    city: trestleProperty.City || "",
    state: trestleProperty.StateOrProvince || "",
    zip_code: trestleProperty.PostalCode || "",
    latitude: trestleProperty.Latitude ?? 0,
    longitude: trestleProperty.Longitude ?? 0,
    createdAt: trestleProperty.OnMarketDate || new Date().toISOString(),
    updatedAt: trestleProperty.OnMarketDate || new Date().toISOString()
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    console.log('🏠 Properties API: Fetching from Trestle API...');
    
    // Extract query parameters
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const minBedrooms = searchParams.get('minBedrooms') ? Number(searchParams.get('minBedrooms')) : undefined;
    const maxBedrooms = searchParams.get('maxBedrooms') ? Number(searchParams.get('maxBedrooms')) : undefined;
    const minBathrooms = searchParams.get('minBathrooms') ? Number(searchParams.get('minBathrooms')) : undefined;
    const maxBathrooms = searchParams.get('maxBathrooms') ? Number(searchParams.get('maxBathrooms')) : undefined;
    const propertyType = searchParams.get('propertyType');
    const hasPool = searchParams.get('hasPool') === 'true';
    const hasView = searchParams.get('hasView') === 'true';
    const keywords = searchParams.get('keywords');
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    // Build filters for Trestle API
    const filters: Record<string, any> = {
      '$top': limit,
      '$skip': offset,
      '$orderby': 'OnMarketDate desc',
      '$filter': []
    };

    // Build filter conditions
    const filterConditions: string[] = [];
    
    // Always filter for active properties
    filterConditions.push("StandardStatus eq 'Active'");
    
    if (city) {
      filterConditions.push(`contains(tolower(City), '${city.toLowerCase()}')`);
    }
    
    if (state) {
      filterConditions.push(`contains(tolower(StateOrProvince), '${state.toLowerCase()}')`);
    }
    
    if (minPrice !== undefined) {
      filterConditions.push(`ListPrice ge ${minPrice}`);
    }
    
    if (maxPrice !== undefined) {
      filterConditions.push(`ListPrice le ${maxPrice}`);
    }
    
    if (minBedrooms !== undefined) {
      filterConditions.push(`BedroomsTotal ge ${minBedrooms}`);
    }
    
    if (maxBedrooms !== undefined) {
      filterConditions.push(`BedroomsTotal le ${maxBedrooms}`);
    }
    
    if (minBathrooms !== undefined) {
      filterConditions.push(`BathroomsTotalInteger ge ${minBathrooms}`);
    }
    
    if (maxBathrooms !== undefined) {
      filterConditions.push(`BathroomsTotalInteger le ${maxBathrooms}`);
    }
    
    if (propertyType && propertyType !== 'All') {
      filterConditions.push(`PropertyType eq '${propertyType}'`);
    }
    
    if (hasPool) {
      filterConditions.push("Pool ne null and Pool ne ''");
    }
    
    if (hasView) {
      filterConditions.push("View ne null and View ne ''");
    }

    // Combine all filter conditions
    if (filterConditions.length > 0) {
      filters['$filter'] = filterConditions.join(' and ');
    }

    console.log('🔍 Trestle API filters:', filters);

    // Fetch properties from Trestle API
    const trestleProperties = await trestleApi.getAllProperties(filters, limit);
    
    console.log(`✅ Received ${trestleProperties.length} properties from Trestle API`);

    // Convert to app format
    const convertedProperties = trestleProperties.map(convertTrestleToAppFormat);

    // For pagination - calculate proper total for up to 70 pages max
    const maxPages = 70;
    const maxTotal = maxPages * limit;
    
    // If we get the full requested amount, there are likely more
    const hasMore = trestleProperties.length === limit && offset + limit < maxTotal;
    
    // Estimate total based on current position and available data
    let estimatedTotal;
    if (trestleProperties.length < limit) {
      // We've reached the end
      estimatedTotal = offset + trestleProperties.length;
    } else if (offset + limit >= maxTotal) {
      // We've reached max pages
      estimatedTotal = maxTotal;
    } else {
      // Estimate based on current progress (but cap at maxTotal)
      estimatedTotal = Math.min(maxTotal, offset + limit * 10); // Conservative estimate
    }
    
    const total = estimatedTotal;

    return NextResponse.json({
      success: true,
      data: convertedProperties,
      pagination: {
        total: total,
        limit: limit,
        offset: offset,
        hasMore: hasMore
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching properties from Trestle API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch properties from Trestle API',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'search':
        const result = db.searchProperties(params as PropertySearchQuery);
        return NextResponse.json({
          success: true,
          data: result.properties,
          pagination: {
            total: result.total,
            limit: params.limit || 20,
            offset: params.offset || 0,
            hasMore: result.hasMore
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Error processing POST request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
