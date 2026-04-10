import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Try to check authentication (optional for localStorage users)
        try {
            const user = await getCurrentUser();
            // Optional: verify user is agent if session exists
        } catch (authError) {
            // Allow request to proceed even if session auth fails
            // (for localStorage-authenticated agents)
        }

        const body = await request.json();
        const { message_id } = body;

        if (!message_id) {
            return NextResponse.json(
                { success: false, message: 'Message ID is required' },
                { status: 400 }
            );
        }

        // Delete message from database using Supabase
        await db.deleteMessage(message_id);

        return NextResponse.json({
            success: true,
            message: 'Message deleted successfully',
        });

    } catch (error) {
        console.error('Delete message error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to delete message' },
            { status: 500 }
        );
    }
}
