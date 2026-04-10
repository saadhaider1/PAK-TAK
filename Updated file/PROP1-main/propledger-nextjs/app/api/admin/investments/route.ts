import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = () => createSupabaseAdminClient();

// GET  — fetch all investment requests + restriction info
export async function GET() {
    try {
        const db = supabase();

        const { data: investments, error } = await db
            .from('investment_requests')
            .select(`
                *,
                users:user_id (
                    id,
                    full_name,
                    email,
                    phone
                ),
                properties:property_id (
                    id,
                    title,
                    location,
                    price,
                    property_type
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch restriction list
        const { data: restrictions } = await db
            .from('user_investment_restrictions')
            .select('*');

        return NextResponse.json({
            success: true,
            investments: investments || [],
            restrictions: restrictions || [],
        }, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
    } catch (err: any) {
        console.error('Admin investments GET error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// POST — admin actions: approve | reject | restrict | unrestrict | set_total
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;
        const db = supabase();

        if (action === 'approve') {
            const { investment_id, admin_note } = body;
            const { error } = await db
                .from('investment_requests')
                .update({ status: 'approved', admin_note, reviewed_at: new Date().toISOString() })
                .eq('id', investment_id);
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Investment approved' });
        }

        if (action === 'reject') {
            const { investment_id, admin_note } = body;
            const { error } = await db
                .from('investment_requests')
                .update({ status: 'rejected', admin_note, reviewed_at: new Date().toISOString() })
                .eq('id', investment_id);
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Investment rejected' });
        }

        if (action === 'restrict') {
            const { user_id, reason } = body;
            const { error } = await db
                .from('user_investment_restrictions')
                .upsert({ user_id, reason, restricted_at: new Date().toISOString(), is_active: true }, { onConflict: 'user_id' });
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'User restricted from investing' });
        }

        if (action === 'unrestrict') {
            const { user_id } = body;
            const { error } = await db
                .from('user_investment_restrictions')
                .update({ is_active: false })
                .eq('user_id', user_id);
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'User investment restriction removed' });
        }

        if (action === 'set_total') {
            const { investment_id, total_amount } = body;
            const { error } = await db
                .from('investment_requests')
                .update({ admin_set_amount: total_amount })
                .eq('id', investment_id);
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Total investment amount updated' });
        }

        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    } catch (err: any) {
        console.error('Admin investments POST error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
