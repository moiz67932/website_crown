import { NextRequest, NextResponse } from 'next/server';
import { getPropertySyncService } from '@/lib/property-sync';

export async function GET(request: NextRequest) {
  try {
    const syncService = getPropertySyncService();
    const status = syncService.getSyncStatus();
    const apiHealth = await syncService.getApiHealthStatus();

    return NextResponse.json({
      success: true,
      data: {
        syncStatus: status,
        apiHealth
      }
    });

  } catch (error: any) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get sync status',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, syncType } = body;
    const syncService = getPropertySyncService();

    switch (action) {
      case 'start':
        syncService.startScheduledSync();
        return NextResponse.json({ success: true, message: 'Scheduled sync started' });

      case 'stop':
        syncService.stopScheduledSync();
        return NextResponse.json({ success: true, message: 'Scheduled sync stopped' });

      case 'trigger': {
        const result = await syncService.triggerManualSync(syncType || 'recent');
        return NextResponse.json({ success: true, data: result });
      }

      case 'test': {
        const isConnected = await syncService.testApiConnection();
        return NextResponse.json({ success: true, data: { connected: isConnected } });
      }

      case 'cleanup':
        syncService.cleanupOldLogs();
        return NextResponse.json({ success: true, message: 'Old logs cleaned up' });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error processing sync request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process sync request',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
