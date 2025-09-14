import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { PropertyAlertsService } from '@/lib/database';

// Loosen param typing for Next.js route handler validation compatibility
interface RouteParams { params: any }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid alert ID' },
        { status: 400 }
      );
    }

    if (action === 'mark_read') {
      const uid = typeof currentUser.userId === 'string' ? parseInt(currentUser.userId, 10) : currentUser.userId;
      const result = PropertyAlertsService.markAlertAsRead(uid, alertId);

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message
      });

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Update property alert error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = AuthService.getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid alert ID' },
        { status: 400 }
      );
    }

  const uid = typeof currentUser.userId === 'string' ? parseInt(currentUser.userId, 10) : currentUser.userId;
  const result = PropertyAlertsService.deletePropertyAlert(uid, alertId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Delete property alert error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
