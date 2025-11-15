// app/api/properties/search/route.ts
// This is an alias/wrapper around the main properties API to support legacy clients
import { NextRequest } from 'next/server';
import { GET as propertiesGET } from '../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/properties/search
 * Redirects to the main properties endpoint for backwards compatibility
 */
export async function GET(request: NextRequest) {
  // Simply delegate to the main properties route handler
  return propertiesGET(request);
}
