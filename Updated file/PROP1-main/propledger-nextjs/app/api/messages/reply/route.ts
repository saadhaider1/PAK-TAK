import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Try to check authentication (optional for localStorage users)
        try {
            const user = await getCurrentUser();
            if (user && user.type !== 'agent') {
                return NextResponse.json(
                    { success: false, message: 'Access denied: Agents only' },
                    { status: 403 }
                );
            }
        } catch (authError) {
            // Allow request to proceed even if session auth fails
            // (for localStorage-authenticated agents)
        }

        const body = await request.json();
        const { message_id, reply_message } = body;

        if (!message_id || !reply_message) {
            return NextResponse.json(
                { success: false, message: 'Message ID and reply message are required' },
                { status: 400 }
            );
        }

        // Reply to the message in the database
        await db.replyToMessage(message_id, reply_message);

        return NextResponse.json({
            success: true,
            message: 'Reply sent successfully!',
        });

    } catch (error) {
        console.error('Reply message error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to send reply' },
            { status: 500 }
        );
    }
}
