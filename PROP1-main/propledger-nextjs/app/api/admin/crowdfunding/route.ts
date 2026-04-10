import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const db = () => createSupabaseAdminClient();

// ─── Helper: re-sync a campaign's available_tokens + funder count ─────────────
async function syncCampaignStats(supabase: ReturnType<typeof db>, campaign_id: number) {
    try {
        // Sum all *approved* contributions for this campaign
        const { data: approvedRequests, error: reqErr } = await supabase
            .from('crowdfunding_requests')
            .select('amount, admin_set_amount, user_id')
            .eq('campaign_id', campaign_id)
            .eq('status', 'approved');

        if (reqErr) {
            console.error('syncCampaignStats fetch error:', reqErr);
            return;
        }

        // Total raised = sum of (admin_set_amount ?? amount)
        const totalRaised = (approvedRequests || []).reduce((sum, r) => {
            return sum + (r.admin_set_amount ?? r.amount);
        }, 0);

        // Unique funders = distinct user_ids
        const uniqueFunders = new Set((approvedRequests || []).map(r => r.user_id)).size;

        // Fetch current property to calculate token delta
        const { data: property, error: propErr } = await supabase
            .from('properties')
            .select('total_tokens, token_price, price')
            .eq('id', campaign_id)
            .single();

        if (propErr || !property) {
            console.error('syncCampaignStats property fetch error:', propErr);
            return;
        }

        // Convert raised amount into consumed tokens
        // available_tokens = total_tokens - (totalRaised / token_price)
        const tokenPrice = property.token_price || 1;
        const tokensConsumed = Math.floor(totalRaised / tokenPrice);
        const newAvailableTokens = Math.max(0, property.total_tokens - tokensConsumed);

        // Store unique_funders + total_raised in description metadata
        // so the frontend can read it without a separate join
        const { data: currentProp } = await supabase
            .from('properties')
            .select('description')
            .eq('id', campaign_id)
            .single();

        let description = currentProp?.description || '';

        // Strip existing CF_STATS block
        description = description.replace(/\[CF_STATS\][\s\S]*?\[\/CF_STATS\]/g, '').trim();

        // Append new CF_STATS
        const cfStats = JSON.stringify({ total_raised: totalRaised, unique_funders: uniqueFunders });
        description = description + '\n\n[CF_STATS]' + cfStats + '[/CF_STATS]';

        // Update property
        const { error: updateErr } = await supabase
            .from('properties')
            .update({
                available_tokens: newAvailableTokens,
                description,
                updated_at: new Date().toISOString(),
            })
            .eq('id', campaign_id);

        if (updateErr) {
            console.error('syncCampaignStats update error:', updateErr);
        } else {
            console.log(`[CF Sync] campaign ${campaign_id} → raised=${totalRaised}, funders=${uniqueFunders}, available_tokens=${newAvailableTokens}`);
        }
    } catch (err) {
        console.error('syncCampaignStats unexpected error:', err);
    }
}

// ─── GET — admin fetches all crowdfunding requests ───────────────────────────
export async function GET() {
    try {
        const supabase = db();

        const { data: requests, error } = await supabase
            .from('crowdfunding_requests')
            .select(`
                *,
                users:user_id (
                    id,
                    full_name,
                    email,
                    phone
                ),
                properties:campaign_id (
                    id,
                    title,
                    location,
                    price,
                    property_type
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const { data: restrictions } = await supabase
            .from('user_investment_restrictions')
            .select('*')
            .eq('is_active', true);

        return NextResponse.json({
            success: true,
            requests: requests || [],
            restrictions: restrictions || [],
        }, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
    } catch (err: any) {
        console.error('Admin crowdfunding GET error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ─── POST — admin actions ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;
        const supabase = db();

        // ── Approve ────────────────────────────────────────────────────────────
        if (action === 'approve') {
            const { request_id, admin_note } = body;

            // Fetch the request first so we know which campaign to sync
            const { data: cfReq, error: fetchErr } = await supabase
                .from('crowdfunding_requests')
                .select('campaign_id')
                .eq('id', request_id)
                .single();
            if (fetchErr) throw fetchErr;

            const { error } = await supabase
                .from('crowdfunding_requests')
                .update({ status: 'approved', admin_note, reviewed_at: new Date().toISOString() })
                .eq('id', request_id);
            if (error) throw error;

            // Sync campaign stats (raised + funders) after approval
            if (cfReq?.campaign_id) {
                await syncCampaignStats(supabase, cfReq.campaign_id);
            }

            return NextResponse.json({ success: true, message: 'Crowdfunding request approved' });
        }

        // ── Reject ─────────────────────────────────────────────────────────────
        if (action === 'reject') {
            const { request_id, admin_note } = body;

            const { data: cfReq } = await supabase
                .from('crowdfunding_requests')
                .select('campaign_id')
                .eq('id', request_id)
                .single();

            const { error } = await supabase
                .from('crowdfunding_requests')
                .update({ status: 'rejected', admin_note, reviewed_at: new Date().toISOString() })
                .eq('id', request_id);
            if (error) throw error;

            // Re-sync to exclude this now-rejected request from totals
            if (cfReq?.campaign_id) {
                await syncCampaignStats(supabase, cfReq.campaign_id);
            }

            return NextResponse.json({ success: true, message: 'Crowdfunding request rejected' });
        }

        // ── Restrict ───────────────────────────────────────────────────────────
        if (action === 'restrict') {
            const { user_id, reason } = body;
            const { error } = await supabase
                .from('user_investment_restrictions')
                .upsert({ user_id, reason, restricted_at: new Date().toISOString(), is_active: true }, { onConflict: 'user_id' });
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'User restricted from investing' });
        }

        // ── Unrestrict ─────────────────────────────────────────────────────────
        if (action === 'unrestrict') {
            const { user_id } = body;
            const { error } = await supabase
                .from('user_investment_restrictions')
                .update({ is_active: false })
                .eq('user_id', user_id);
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Restriction removed' });
        }

        // ── Set Amount ─────────────────────────────────────────────────────────
        if (action === 'set_amount') {
            const { request_id, admin_set_amount } = body;

            const { data: cfReq } = await supabase
                .from('crowdfunding_requests')
                .select('campaign_id')
                .eq('id', request_id)
                .single();

            const { error } = await supabase
                .from('crowdfunding_requests')
                .update({ admin_set_amount: parseFloat(admin_set_amount) })
                .eq('id', request_id);
            if (error) throw error;

            // Re-sync so raised amount updates if this request is already approved
            if (cfReq?.campaign_id) {
                await syncCampaignStats(supabase, cfReq.campaign_id);
            }

            return NextResponse.json({ success: true, message: 'Amount updated' });
        }

        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    } catch (err: any) {
        console.error('Admin crowdfunding POST error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
