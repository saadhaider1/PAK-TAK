import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agent_id');

        if (!agentId) {
            return NextResponse.json(
                { success: false, message: 'agent_id is required' },
                { status: 400 }
            );
        }

        // Get pending calls for the agent
        const calls = await db.getAgentPendingCalls(agentId);

        return NextResponse.json({
            success: true,
            calls,
            count: calls.length
        }, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

    } catch (error) {
        console.error('Check incoming calls error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to check calls' },
            { status: 500 }
        );
    }
}
