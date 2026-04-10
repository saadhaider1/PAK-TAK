import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET unread admin notifications
export async function GET() {
    try {
        const db = createSupabaseAdminClient();

        const { data, error } = await db
            .from('admin_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const unreadCount = (data || []).filter(n => !n.is_read).length;

        return NextResponse.json({
            success: true,
            notifications: data || [],
            unread_count: unreadCount,
        }, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
    } catch (err: any) {
        console.error('Notifications GET error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// POST — mark as read
export async function POST(req: Request) {
    try {
        const { id, mark_all } = await req.json();
        const db = createSupabaseAdminClient();

        if (mark_all) {
            await db.from('admin_notifications').update({ is_read: true }).eq('is_read', false);
        } else if (id) {
            await db.from('admin_notifications').update({ is_read: true }).eq('id', id);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
