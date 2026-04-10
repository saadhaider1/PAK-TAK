import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextauth.config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(getAuthOptions());

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: session.user,
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { success: false, message: 'Session check failed' },
      { status: 500 }
    );
  }
}
