import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const supabase = createSupabaseAdminClient();

        // Fetch counts from Supabase
        const [usersResult, agentsResult, propertiesResult, transactionsResult] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('agents').select('*', { count: 'exact', head: true }),
            supabase.from('properties').select('*', { count: 'exact', head: true }),
            supabase.from('token_transactions').select('*', { count: 'exact', head: true })
        ]);

        // Fetch token statistics
        const { data: tokenStats } = await supabase
            .from('token_transactions')
            .select('transaction_type, token_amount, pkr_amount, status')
            .eq('status', 'completed');

        // Calculate revenue breakdown
        let totalRevenue = 0;
        let purchaseRevenue = 0;
        let spendRevenue = 0;

        if (tokenStats) {
            tokenStats.forEach(tx => {
                if (tx.transaction_type === 'purchase') {
                    purchaseRevenue += tx.pkr_amount || 0;
                } else if (tx.transaction_type === 'spend') {
                    spendRevenue += tx.pkr_amount || 0;
                }
            });
            totalRevenue = purchaseRevenue;
        }

        // Fetch recent activity
        const { data: recentUsers } = await supabase
            .from('users')
            .select('id, full_name, email, user_type, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        const { data: recentTransactions } = await supabase
            .from('token_transactions')
            .select('id, user_id, transaction_type, token_amount, pkr_amount, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        return NextResponse.json({
            success: true,
            stats: {
                total_users: usersResult.count || 0,
                total_agents: agentsResult.count || 0,
                total_properties: propertiesResult.count || 0,
                total_transactions: transactionsResult.count || 0,
                total_revenue: totalRevenue,
                revenue_breakdown: {
                    purchases: purchaseRevenue,
                    spent: spendRevenue
                }
            },
            recent: {
                users: recentUsers || [],
                transactions: recentTransactions || []
            }
        }, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch stats',
            stats: {
                total_users: 0,
                total_agents: 0,
                total_properties: 0,
                total_transactions: 0,
                total_revenue: 0,
                revenue_breakdown: {
                    purchases: 0,
                    spent: 0
                }
            },
            recent: {
                users: [],
                transactions: []
            }
        }, { status: 500 });
    }
}
