import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

/**
 * Debug endpoint to test the agents query and see why some agents are missing
 */
export async function GET() {
    try {
        const supabase = createSupabaseAdminClient()

        // Test 1: Get all agents without join
        const { data: allAgents, error: allError } = await supabase
            .from('agents')
            .select('*')
            .in('status', ['approved', 'pending'])
            .order('id')

        // Test 2: Get all agents with join (current query)
        const { data: joinedAgents, error: joinError } = await supabase
            .from('agents')
            .select(`
        *,
        users!inner (
          full_name,
          email
        )
      `)
            .in('status', ['approved', 'pending'])
            .order('id')

        // Test 3: Get agent ID 1 specifically
        const { data: agent1, error: agent1Error } = await supabase
            .from('agents')
            .select(`
        *,
        users (
          full_name,
          email
        )
      `)
            .eq('id', 1)
            .single()

        // Test 4: Check if user exists for agent ID 1
        let userCheck = null
        if (allAgents && allAgents.length > 0) {
            const agent1Data = allAgents.find(a => a.id === 1)
            if (agent1Data) {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', agent1Data.user_id)
                    .single()

                userCheck = {
                    agent1UserId: agent1Data.user_id,
                    userExists: !!userData,
                    userData,
                    userError: userError?.message || null,
                }
            }
        }

        return NextResponse.json({
            success: true,
            tests: {
                test1_allAgents: {
                    count: allAgents?.length || 0,
                    agents: allAgents,
                    error: allError?.message || null,
                },
                test2_joinedAgents: {
                    count: joinedAgents?.length || 0,
                    agents: joinedAgents,
                    error: joinError?.message || null,
                },
                test3_agent1: {
                    found: !!agent1,
                    data: agent1,
                    error: agent1Error?.message || null,
                },
                test4_userCheck: userCheck,
            },
        })
    } catch (error: any) {
        console.error('Debug agents query error:', error)
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        )
    }
}
