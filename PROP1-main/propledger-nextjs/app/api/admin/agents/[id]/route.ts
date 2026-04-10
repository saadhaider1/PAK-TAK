import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { action } = await request.json();
        const agentId = params.id;

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid action. Must be "approve" or "reject"'
            }, { status: 400 });
        }

        const supabase = createSupabaseAdminClient();

        // Update agent status
        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        const { data: agent, error } = await supabase
            .from('agents')
            .update({ status: newStatus })
            .eq('id', agentId)
            .select(`
                *,
                users:user_id (
                    full_name,
                    email
                )
            `)
            .single();

        if (error) {
            console.error('Error updating agent status:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Agent ${newStatus} successfully`,
            agent
        });
    } catch (error) {
        console.error('Agent status update error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update agent status'
        }, { status: 500 });
    }
}
