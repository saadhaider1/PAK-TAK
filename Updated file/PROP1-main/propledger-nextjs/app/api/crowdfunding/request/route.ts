import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── GET — user fetches their own crowdfunding requests ───────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get('user_id');
        const campaign_id = searchParams.get('campaign_id');

        if (!user_id) {
            return NextResponse.json({ success: false, message: 'user_id is required' }, { status: 400 });
        }

        const db = createSupabaseAdminClient();

        let query = db
            .from('crowdfunding_requests')
            .select(`
                *,
                properties:campaign_id (
                    id,
                    title,
                    location,
                    property_type,
                    image_url,
                    price
                )
            `)
            .eq('user_id', user_id)
            .order('created_at', { ascending: false });

        if (campaign_id) {
            query = query.eq('campaign_id', campaign_id);
        }

        const { data: requests, error } = await query;
        if (error) throw error;

        // Check restriction
        const { data: restriction } = await db
            .from('user_investment_restrictions')
            .select('*')
            .eq('user_id', user_id)
            .eq('is_active', true)
            .single();

        return NextResponse.json({
            success: true,
            requests: requests || [],
            is_restricted: !!restriction,
            restriction_reason: restriction?.reason || null,
        }, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// ─── POST — user submits a crowdfunding contribution request ─────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, campaign_id, campaign_title, amount, user_name, user_email } = body;

        if (!user_id || !campaign_id || !amount) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: user_id, campaign_id, amount' },
                { status: 400 }
            );
        }

        const db = createSupabaseAdminClient();

        // Check restriction
        const { data: restriction } = await db
            .from('user_investment_restrictions')
            .select('*')
            .eq('user_id', user_id)
            .eq('is_active', true)
            .single();

        if (restriction) {
            return NextResponse.json({
                success: false,
                restricted: true,
                message: `Your investing privileges have been restricted. Reason: ${restriction.reason || 'Contact admin.'}`
            }, { status: 403 });
        }

        // Prevent duplicate pending request on same campaign
        const { data: existing } = await db
            .from('crowdfunding_requests')
            .select('id, status')
            .eq('user_id', user_id)
            .eq('campaign_id', campaign_id)
            .eq('status', 'pending')
            .single();

        if (existing) {
            return NextResponse.json({
                success: false,
                message: 'You already have a pending request for this campaign. Please wait for admin review.'
            }, { status: 409 });
        }

        // Insert request
        const { data: cfRequest, error } = await db
            .from('crowdfunding_requests')
            .insert({
                user_id,
                campaign_id: parseInt(campaign_id),
                campaign_title,
                user_name,
                user_email,
                amount: parseFloat(amount),
                status: 'pending',
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        // Admin notification
        await db
            .from('admin_notifications')
            .insert({
                type: 'crowdfunding_request',
                title: 'New Crowdfunding Request',
                message: `${user_name || 'A user'} wants to contribute PKR ${parseFloat(amount).toLocaleString()} to "${campaign_title || `Campaign #${campaign_id}`}"`,
                reference_id: cfRequest.id?.toString(),
                is_read: false,
                created_at: new Date().toISOString(),
            });

        return NextResponse.json({
            success: true,
            request: cfRequest,
            message: 'Crowdfunding request submitted. Awaiting admin approval.',
        });
    } catch (err: any) {
        console.error('Submit crowdfunding request error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
