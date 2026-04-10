import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { message_id } = body;

        if (!message_id) {
            return NextResponse.json(
                { success: false, message: 'Message ID is required' },
                { status: 400 }
            );
        }

        // Mark message as read
        await db.updateMessageStatus(message_id, 'read');

        return NextResponse.json({
            success: true,
            message: 'Message marked as read',
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to mark as read' },
            { status: 500 }
        );
    }
}
