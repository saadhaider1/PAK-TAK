import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { caller_id, agent_id, agent_name, caller_name } = body;

        // Validate required fields
        if (!caller_id || !agent_id || !agent_name || !caller_name) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate unique room ID
        const roomId = `propledger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create video call record
        const call = await db.createVideoCall({
            caller_id,
            agent_id,
            agent_name,
            caller_name,
            room_id: roomId
        });

        return NextResponse.json({
            success: true,
            call,
            message: 'Video call initiated successfully'
        });

    } catch (error) {
        console.error('Initiate video call error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to initiate call' },
            { status: 500 }
        );
    }
}
