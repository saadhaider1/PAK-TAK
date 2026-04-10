import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const supabase = createSupabaseAdminClient();

        // Fetch all agents with user details
        const { data: agents, error, count } = await supabase
            .from('agents')
            .select(`
                *,
                users:user_id (
                    full_name,
                    email,
                    phone
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching agents:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            agents: agents || [],
            total: count || 0
        }, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Agents fetch error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch agents',
            agents: [],
            total: 0
        }, { status: 500 });
    }
}
