import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── GET — fetch a user's investment requests (optionally filtered by property)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get('user_id');
        const property_id = searchParams.get('property_id');

        if (!user_id) {
            return NextResponse.json({ success: false, message: 'user_id is required' }, { status: 400 });
        }

        const db = createSupabaseAdminClient();

        let query = db
            .from('investment_requests')
            .select(`
                *,
                properties:property_id (
                    id,
                    title,
                    location,
                    property_type,
                    image_url
                )
            `)
            .eq('user_id', user_id)
            .order('created_at', { ascending: false });

        // If property_id supplied, narrow to that property only
        if (property_id) {
            query = query.eq('property_id', property_id);
        }

        const { data: requests, error } = await query;
        if (error) throw error;

        // Check restriction status
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

// ─── POST — user submits investment request
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, property_id, amount, property_title, user_name, user_email } = body;

        if (!user_id || !property_id || !amount) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields: user_id, property_id, amount' },
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
            return NextResponse.json(
                {
                    success: false,
                    restricted: true,
                    message: `Your investing privileges have been restricted. Reason: ${restriction.reason || 'Contact admin for details.'}`
                },
                { status: 403 }
            );
        }

        // Check for any existing PENDING request on this property — prevent duplicates
        const { data: existing } = await db
            .from('investment_requests')
            .select('id, status')
            .eq('user_id', user_id)
            .eq('property_id', property_id)
            .eq('status', 'pending')
            .single();

        if (existing) {
            return NextResponse.json(
                { success: false, message: 'You already have a pending investment request for this property. Please wait for admin review.' },
                { status: 409 }
            );
        }

        // Insert new request (status: pending)
        const { data: investment, error } = await db
            .from('investment_requests')
            .insert({
                user_id,
                property_id: parseInt(property_id),
                amount: parseFloat(amount),
                status: 'pending',
                property_title,
                user_name,
                user_email,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        // Create admin notification
        await db
            .from('admin_notifications')
            .insert({
                type: 'investment_request',
                title: 'New Investment Request',
                message: `${user_name || 'A user'} has requested to invest PKR ${parseFloat(amount).toLocaleString()} in "${property_title || `Property #${property_id}`}"`,
                reference_id: investment.id?.toString(),
                is_read: false,
                created_at: new Date().toISOString(),
            });

        return NextResponse.json({
            success: true,
            investment,
            message: 'Investment request submitted successfully. Awaiting admin approval.',
        });
    } catch (err: any) {
        console.error('Submit investment request error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
