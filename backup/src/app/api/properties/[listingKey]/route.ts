import { NextRequest, NextResponse } from 'next/server';
import { getPropertyByListingKey } from '@/lib/db/property-repo';

// Now sourcing from Postgres rather than external Trestle API

// Removed Trestle transformation helpers – now direct DB mapping

export async function GET(
  _request: NextRequest,
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

    // Fetch property from Postgres
    const row = await getPropertyByListingKey(listingKey);
    if (!row) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }
    // Images: prefer media_urls array, then raw_json.Media/Photos, finally main_photo_url
    const images: string[] = (() => {
      const out: string[] = [];
      const media = (row as any).media_urls;
      if (Array.isArray(media) && media.length) return media.filter(Boolean);
      const raw = (row as any).raw_json;
      try {
        if (raw) {
          if (Array.isArray(raw.Media)) {
            const urls = raw.Media.map((m: any) => m.MediaURL).filter(Boolean);
            if (urls.length) return urls;
          }
          if (Array.isArray(raw.Photos)) {
            const urls = raw.Photos.map((p: any) => p.Url || p.url).filter(Boolean);
            if (urls.length) return urls;
          }
        }
      } catch {}
      if ((row as any).main_photo_url) out.push((row as any).main_photo_url);
      return out;
    })();

    const detail = {
      _id: row.listing_key,
      listing_key: row.listing_key,
      listing_id: row.listing_key,
      list_price: row.list_price || 0,
      previous_list_price: (row as any).previous_list_price || null,
      lease_amount: null,
      address: (row as any).unparsed_address || '',
      city: (row as any).city || '',
      county: (row as any).county || '',
      postal_code: (row as any).postal_code || '',
      latitude: (row as any).latitude || 0,
      longitude: (row as any).longitude || 0,
      property_type: (row as any).property_type || 'Residential',
      property_sub_type: (row as any).property_sub_type || '',
      bedrooms: (row as any).bedrooms || (row as any).bedrooms_total || 0,
      bathrooms: (row as any).bathrooms_total || 0,
      living_area_sqft: (row as any).living_area || 0,
      lot_size_sqft: (row as any).lot_size_sqft || (row as any).lot_size_sq_ft || 0,
      year_built: (row as any).year_built || 0,
      zoning: null,
      status: (row as any).status || '',
      mls_status: (row as any).status || '',
      days_on_market: (row as any).days_on_market || 0,
      listing_contract_date: (row as any).listing_contract_date || '',
      public_remarks: (row as any).public_remarks || ((row as any).raw_json?.PublicRemarks) || '',
      subdivision_name: '',
      main_photo_url: images[0] || null,
      images,
      photosCount: (row as any).photos_count || images.length,
      list_agent_full_name: (row as any).list_agent_full_name || '',
      list_office_name: (row as any).list_office_name || '',
      list_agent_email: '',
      list_agent_phone: '',
      lease_considered: false,
      lease_amount_frequency: null,
      modification_timestamp: (row as any).modification_ts || '',
      on_market_timestamp: (row as any).first_seen_ts || '',
      agent_phone: '',
      agent_email: '',
      agent_office_email: '',
      agent_office_phone: '',
      ListAgentLastName: '',
      ListAgentURL: null,
      possible_use: null,
      price_change_timestamp: (row as any).price_change_ts || null,
      VirtualTourURLUnbranded: null,
      view: (row as any).view || '',
      Utilities: null,
      LotFeatures: null,
      ShowingContactName: null,
      current_price: row.list_price || 0,
      seo_title: null,
      faq_content: null,
      h1_heading: null,
      amenities_content: null,
      page_content: null,
      meta_description: null,
      title: null,
      other_info: {},
      interior_features: (row as any).interior_features || '',
      stories: (row as any).stories || 1,
      pool_features: (row as any).pool_features || '',
      parking_total: (row as any).parking_total?.toString() || '0',
      garage_size: (row as any).garage_spaces?.toString() || '0',
      heating: (row as any).heating || '',
      cooling: (row as any).cooling || '',
      security_features: (row as any).security_features || '',
      parking_features: (row as any).parking_features || '',
      laundry_features: (row as any).laundry_features || '',
    };

    return NextResponse.json({ success: true, data: detail });

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
