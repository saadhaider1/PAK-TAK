import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const supabase = createSupabaseAdminClient();

        // Fetch all users with pagination
        const { data: users, error, count } = await supabase
            .from('users')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            users: users || [],
            total: count || 0
        }, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Users fetch error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch users',
            users: [],
            total: 0
        }, { status: 500 });
    }
}
