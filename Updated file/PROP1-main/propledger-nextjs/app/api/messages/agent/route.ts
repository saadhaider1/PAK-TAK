import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const agentNameParam = searchParams.get('agent_name');

        let agentName: string | null = null;
        let authMethod = 'none';

        // Try to get user from session first
        try {
            const user = await getCurrentUser();
            if (user && user.type === 'agent') {
                agentName = user.name;
                authMethod = 'session';
            }
        } catch (authError) {
            // Session auth failed, will try query parameter
            console.log('Session auth failed, trying query parameter');
        }

        // If session auth didn't provide agent name, try query parameter
        if (!agentName && agentNameParam) {
            agentName = agentNameParam;
            authMethod = 'query_param';
        }

        // If still no agent name, return error
        if (!agentName) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Authentication required. Please login as an agent or provide agent_name parameter.',
                    debug: {
                        has_session: false,
                        has_agent_name_param: !!agentNameParam,
                    }
                },
                { status: 401 }
            );
        }

        // Get agent messages from the database
        const messages = await db.getAgentMessages(agentName);

        // Count unread messages
        const unreadCount = messages.filter(msg => msg.status === 'unread').length;

        return NextResponse.json({
            success: true,
            messages,
            total_count: messages.length,
            unread_count: unreadCount,
            agent_name: agentName,
            debug: {
                agent_name_used: agentName,
                message_count: messages.length,
                auth_method: authMethod,
            }
        });

    } catch (error) {
        console.error('Get agent messages error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to retrieve messages' },
            { status: 500 }
        );
    }
}
