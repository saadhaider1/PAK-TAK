import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');

    let userId: string | null = null;
    let authMethod = 'none';

    // Try to get user from session first
    try {
      const user = await getCurrentUser();
      if (user) {
        userId = user.id.toString();
        authMethod = 'session';
      }
    } catch (authError) {
      // Session auth failed, will try query parameter
    }

    // If session auth didn't provide user ID, try query parameter
    if (!userId && userIdParam) {
      userId = userIdParam;
      authMethod = 'query_param';
    }

    // If still no user ID, return error
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required. Please login or provide user_id parameter.'
        },
        { status: 401 }
      );
    }

    // Get user messages from the database
    const messages = await db.getUserMessages(userId);

    return NextResponse.json({
      success: true,
      messages,
      total_count: messages.length,
      debug: {
        user_id_used: userId,
        message_count: messages.length,
        auth_method: authMethod,
      }
    });

  } catch (error) {
    console.error('Get user messages error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}
