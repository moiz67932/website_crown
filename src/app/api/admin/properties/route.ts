// API endpoint for admin property management
// Uses the same database connection as /api/properties

import { NextRequest, NextResponse } from 'next/server';
import { getPgPool } from '@/lib/db/connection';
import { deriveDisplayName } from '@/lib/display-name';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AdminPropertyStats {
  total: number;
  active: number;
  sold: number;
  pending: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    console.log('🏠 Admin Properties API: Fetching from Postgres...');

    // Extract query parameters
    const searchQuery = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';
    const typeFilter = searchParams.get('type') || '';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    const pool = await getPgPool();
    
    // Build WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Search filter (address, city, or postal_code)
    if (searchQuery) {
      conditions.push(`(
        LOWER(cleaned_address) LIKE LOWER($${paramIndex}) OR 
        LOWER(unparsed_address) LIKE LOWER($${paramIndex}) OR 
        LOWER(city) LIKE LOWER($${paramIndex}) OR 
        postal_code LIKE $${paramIndex}
      )`);
      values.push(`%${searchQuery}%`);
      paramIndex++;
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      conditions.push(`LOWER(status) = LOWER($${paramIndex})`);
      values.push(statusFilter);
      paramIndex++;
    }

    // Type filter
    if (typeFilter && typeFilter !== 'all') {
      conditions.push(`LOWER(property_type) LIKE LOWER($${paramIndex})`);
      values.push(`%${typeFilter}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count for all properties
    const totalCountQuery = `SELECT COUNT(*) as count FROM properties`;
    const totalCountResult = await pool.query(totalCountQuery);
    const totalProperties = parseInt(totalCountResult.rows[0]?.count || '0');

    // Get filtered count
    const filteredCountQuery = `SELECT COUNT(*) as count FROM properties ${whereClause}`;
    const filteredCountResult = await pool.query(filteredCountQuery, values);
    const filteredTotal = parseInt(filteredCountResult.rows[0]?.count || '0');

    // Get stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'active') as active,
        COUNT(*) FILTER (WHERE LOWER(status) = 'sold') as sold,
        COUNT(*) FILTER (WHERE LOWER(status) IN ('pending', 'under contract', 'contingent')) as pending
      FROM properties
    `;
    const statsResult = await pool.query(statsQuery);
    const stats: AdminPropertyStats = {
      total: parseInt(statsResult.rows[0]?.total || '0'),
      active: parseInt(statsResult.rows[0]?.active || '0'),
      sold: parseInt(statsResult.rows[0]?.sold || '0'),
      pending: parseInt(statsResult.rows[0]?.pending || '0'),
    };

    // Get properties with pagination
    const propertiesQuery = `
      SELECT
        listing_key,
        status,
        mls_status,
        property_type,
        photos_count,
        main_photo_url,
        list_price,
        bedrooms_total,
        bathrooms_total,
        living_area,
        city,
        state_or_province,
        postal_code,
        latitude,
        longitude,
        unparsed_address,
        cleaned_address,
        listing_id,
        listed_at,
        modification_timestamp,
        updated_at,
        created_at
      FROM properties
      ${whereClause}
      ORDER BY modification_timestamp DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);
    const propertiesResult = await pool.query(propertiesQuery, values);

    // Transform properties to match expected format
    const properties = propertiesResult.rows.map((p: any) => {
      // Use cleaned_address or unparsed_address directly
      const baseAddress = p.cleaned_address || p.unparsed_address || '';

      return {
        id: p.listing_key,
        listing_key: p.listing_key,
        address: baseAddress,
        city: p.city || '',
        state: p.state_or_province || '',
        zipcode: p.postal_code || '',
        price: p.list_price || 0,
        bedrooms: p.bedrooms_total || 0,
        bathrooms: p.bathrooms_total || 0,
        square_feet: p.living_area || 0,
        property_type: p.property_type || 'Unknown',
        status: p.status || 'Unknown',
        listing_date: p.listed_at || p.created_at || new Date().toISOString(),
        images: p.main_photo_url ? [p.main_photo_url] : [],
        main_image_url: p.main_photo_url,
        latitude: p.latitude || 0,
        longitude: p.longitude || 0,
        updatedAt: p.updated_at || p.modification_timestamp || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      properties,
      stats,
      pagination: {
        total: filteredTotal,
        totalProperties,
        limit,
        offset,
        hasMore: offset + limit < filteredTotal,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching admin properties from Postgres:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch properties',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
