import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

/**
 * Diagnostic endpoint to check user and agent data
 * Usage: /api/debug/user-agent?email=user@example.com
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')
        const name = searchParams.get('name')

        if (!email && !name) {
            return NextResponse.json(
                { success: false, message: 'Email or name parameter is required' },
                { status: 400 }
            )
        }

        const supabase = createSupabaseAdminClient()

        // Search for user by email or name
        let query = supabase.from('users').select('*')

        if (email) {
            query = query.eq('email', email)
        } else if (name) {
            query = query.ilike('full_name', `%${name}%`)
        }

        const { data: users, error: userError } = await query

        if (userError) {
            throw userError
        }

        if (!users || users.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'User not found',
                searchedBy: email ? 'email' : 'name',
                searchValue: email || name,
            })
        }

        // For each user, check if they have an agent profile
        const results = await Promise.all(
            users.map(async (user) => {
                const { data: agent, error: agentError } = await supabase
                    .from('agents')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                return {
                    user: {
                        id: user.id,
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone,
                        user_type: user.user_type,
                        created_at: user.created_at,
                    },
                    hasAgentProfile: !!agent,
                    agentProfile: agent || null,
                    agentError: agentError?.message || null,
                }
            })
        )

        return NextResponse.json({
            success: true,
            count: results.length,
            results,
        })
    } catch (error: any) {
        console.error('Debug user-agent error:', error)
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        )
    }
}
