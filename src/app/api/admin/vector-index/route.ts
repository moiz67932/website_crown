import { NextRequest, NextResponse } from 'next/server';
import { getPropertyVectorSearch } from '@/lib/vector-search';
import { PropertyDataValidator } from '@/lib/data-validation';

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

    console.log(`🔍 Indexing ${properties.length} properties for vector search...`);

    // Validate and clean properties
    const validation = PropertyDataValidator.batchValidateProperties(properties);
    
    if (validation.validProperties.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid properties to index' },
        { status: 400 }
      );
    }

    // Index properties in vector database
    vectorSearch.indexProperties(validation.validProperties);
    
    const stats = vectorSearch.getIndexStats();

    console.log(`✅ Vector indexing completed. Stats:`, stats);

    return NextResponse.json({
      success: true,
      data: {
        indexedProperties: validation.validProperties.length,
        invalidProperties: validation.invalidProperties.length,
        stats: stats,
        summary: validation.summary
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
