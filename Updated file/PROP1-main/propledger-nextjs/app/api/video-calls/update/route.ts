import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { call_id, status } = body;

        // Validate required fields
        if (!call_id || !status) {
            return NextResponse.json(
                { success: false, message: 'call_id and status are required' },
                { status: 400 }
            );
        }

        // Validate status
        const validStatuses = ['pending', 'active', 'rejected', 'ended'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, message: 'Invalid status' },
                { status: 400 }
            );
        }

        // Update call status
        await db.updateCallStatus(call_id, status);

        return NextResponse.json({
            success: true,
            message: 'Call status updated successfully'
        });

    } catch (error) {
        console.error('Update call status error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to update call status' },
            { status: 500 }
        );
    }
}
