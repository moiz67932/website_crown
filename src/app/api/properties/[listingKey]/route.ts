import { NextRequest, NextResponse } from 'next/server';
import { createTrestleApiService } from '@/lib/trestle-service';
import { TrestleProperty } from '@/lib/trestle-api';

// Create Trestle API service instance
const trestleApi = createTrestleApiService();

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

// Function to extract property details from description text
function extractPropertyDetailsFromDescription(description: string) {
  const bedRegex = /(\d+)[\s-]*(bed|bedroom|br)/i;
  const bathRegex = /(\d+)[\s-]*(bath|bathroom|ba)/i;
  const sqftRegex = /(\d+,?\d*)\s*(sq\s*ft|sqft|square\s*feet)/i;
  
  // For multi-unit properties, try to find combined info
  const multiUnitBedRegex = /(\d+)\s*bedroom.*?(\d+)\s*bedroom/i;
  const multiUnitSqftRegex = /(\d+)\s*sq\s*ft.*?(\d+)\s*sq\s*ft/i;
  
  const bedMatch = description.match(bedRegex);
  const bathMatch = description.match(bathRegex);
  const sqftMatch = description.match(sqftRegex);
  const multiUnitBedMatch = description.match(multiUnitBedRegex);
  const multiUnitSqftMatch = description.match(multiUnitSqftRegex);
  
  // For multi-unit properties, sum up the units
  let totalBedrooms = null;
  let totalSqft = null;
  
  if (multiUnitBedMatch) {
    // Sum bedrooms from multiple units
    totalBedrooms = parseInt(multiUnitBedMatch[1]) + parseInt(multiUnitBedMatch[2]);
  } else if (bedMatch) {
    totalBedrooms = parseInt(bedMatch[1]);
  }
  
  if (multiUnitSqftMatch) {
    // Sum square footage from multiple units  
    totalSqft = parseInt(multiUnitSqftMatch[1]) + parseInt(multiUnitSqftMatch[2]);
  } else if (sqftMatch) {
    totalSqft = parseInt(sqftMatch[1].replace(',', ''));
  }
  
  // Estimate bathrooms based on bedrooms if not found (conservative estimate)
  let totalBathrooms = null;
  if (bathMatch) {
    totalBathrooms = parseInt(bathMatch[1]);
  } else if (totalBedrooms) {
    // Conservative estimate: assume at least 1 bathroom per 2 bedrooms, minimum 1
    totalBathrooms = Math.max(1, Math.floor(totalBedrooms / 2));
  }
  
  return {
    bedrooms: totalBedrooms,
    bathrooms: totalBathrooms,
    sqft: totalSqft
  };
}

// Function to convert Trestle property to app format for detail page
async function convertTrestleToDetailFormat(trestleProperty: TrestleProperty) {
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

  // Handle coordinates - try to geocode if missing
  let latitude = trestleProperty.Latitude ?? 0;
  let longitude = trestleProperty.Longitude ?? 0;
  
  if ((!latitude || !longitude) && (trestleProperty.UnparsedAddress || trestleProperty.City)) {
    console.log(`🌍 Geocoding address for property ${trestleProperty.ListingKey}...`);
    const geocoded = await geocodeAddress(
      trestleProperty.UnparsedAddress || '',
      trestleProperty.City || '',
      trestleProperty.StateOrProvince || '',
      trestleProperty.PostalCode || ''
    );
    
    if (geocoded) {
      latitude = geocoded.lat;
      longitude = geocoded.lng;
      console.log(`✅ Geocoded coordinates: ${latitude}, ${longitude}`);
    } else {
      console.log(`⚠️ Failed to geocode address for property ${trestleProperty.ListingKey}`);
    }
  }

  // Try to extract property details from description if main fields are missing
  const extractedDetails = extractPropertyDetailsFromDescription(trestleProperty.PublicRemarks || '');
  
  // Use extracted details as fallback when Trestle data is missing or 0
  const finalBedrooms = trestleProperty.BedroomsTotal || extractedDetails.bedrooms;
  const finalBathrooms = trestleProperty.BathroomsTotalInteger || extractedDetails.bathrooms;
  const finalLivingArea = trestleProperty.LivingArea || extractedDetails.sqft;

  return {
    _id: trestleProperty.ListingKey,
    listing_key: trestleProperty.ListingKey,
    listing_id: trestleProperty.ListingKey,
    list_price: trestleProperty.ListPrice || 0,
    previous_list_price: null,
    lease_amount: null,
    address: trestleProperty.UnparsedAddress || "Address not available",
    city: trestleProperty.City || "",
    county: trestleProperty.StateOrProvince || "",
    postal_code: trestleProperty.PostalCode || "",
    latitude: latitude,
    longitude: longitude,
    property_type: trestleProperty.PropertyType || "Residential",
    property_sub_type: trestleProperty.PropertySubType || "",
    bedrooms: finalBedrooms,
    bathrooms: finalBathrooms,
    living_area_sqft: finalLivingArea,
    lot_size_sqft: trestleProperty.LotSizeAcres ? trestleProperty.LotSizeAcres * 43560 : 0,
    year_built: trestleProperty.YearBuilt || 0,
    zoning: null,
    standard_status: trestleProperty.StandardStatus || "",
    mls_status: trestleProperty.StandardStatus || "",
    days_on_market: trestleProperty.DaysOnMarket || 0,
    listing_contract_date: trestleProperty.ListingContractDate || "",
    public_remarks: trestleProperty.PublicRemarks || "",
    subdivision_name: "",
    main_image_url: mainImage,
    images: photos,
    photosCount: trestleProperty.PhotosCount || 0,
    list_agent_full_name: trestleProperty.ListAgentName || "",
    list_office_name: trestleProperty.ListOfficeName || "",
    list_agent_email: "",
    list_agent_phone: "",
    lease_considered: false,
    lease_amount_frequency: null,
    modification_timestamp: trestleProperty.OnMarketDate || "",
    on_market_timestamp: trestleProperty.OnMarketDate || "",
    agent_phone: "",
    agent_email: "",
    agent_office_email: "",
    agent_office_phone: "",
    ListAgentLastName: "",
    ListAgentURL: null,
    possible_use: null,
    price_change_timestamp: null,
    VirtualTourURLUnbranded: trestleProperty.VirtualTourURLUnbranded || null,
    view: trestleProperty.View || "",
    Utilities: trestleProperty.Utilities || null,
    LotFeatures: null,
    ShowingContactName: null,
    current_price: trestleProperty.ListPrice || 0,
    seo_title: null,
    faq_content: null,
    h1_heading: null,
    amenities_content: null,
    page_content: null,
    meta_description: null,
    title: null,
    other_info: {},
    interior_features: trestleProperty.InteriorFeatures || "",
    stories: 1,
    pool_features: trestleProperty.Pool || "",
    parking_total: trestleProperty.ParkingTotal?.toString() || "0",
    garage_size: trestleProperty.GarageSpaces?.toString() || "0",
    heating: trestleProperty.Heating || "",
    cooling: trestleProperty.Cooling || "",
    security_features: "",
    parking_features: "",
    laundry_features: trestleProperty.LaundryFeatures || "",
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingKey: string }> }
) {
  try {
    const { listingKey } = await params;
    
    console.log('🏠 Fetching single property:', listingKey);
    
    if (!listingKey || listingKey === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Valid listing key is required' },
        { status: 400 }
      );
    }

    // Fetch property from Trestle API
    const trestleProperty = await trestleApi.getPropertyByKey(listingKey);

    if (!trestleProperty) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Convert to detail format
    const propertyDetail = await convertTrestleToDetailFormat(trestleProperty);

    return NextResponse.json({
      success: true,
      data: propertyDetail
    });

  } catch (error: any) {
    console.error('❌ Error fetching property detail:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch property',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
