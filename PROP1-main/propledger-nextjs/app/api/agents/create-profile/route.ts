import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

/**
 * API endpoint to manually create agent profiles for users who signed up as agents
 * but don't have an agent record in the agents table
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, licenseNumber, experience, specialization, city, agency, phone } = body

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            )
        }

        const supabase = createSupabaseAdminClient()

        // Check if user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (userError || !user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            )
        }

        // Check if agent profile already exists
        const { data: existingAgent, error: checkError } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (existingAgent) {
            return NextResponse.json(
                { success: false, message: 'Agent profile already exists' },
                { status: 400 }
            )
        }

        // Create agent profile
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .insert({
                user_id: userId,
                license_number: licenseNumber || 'PENDING',
                experience: experience || '0-2 years',
                specialization: specialization || 'General Real Estate',
                city: city || 'Unknown',
                agency: agency || null,
                phone: phone || user.phone,
                status: 'approved',
            })
            .select()
            .single()

        if (agentError) {
            console.error('Agent creation error:', agentError)
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to create agent profile',
                    error: agentError.message
                },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Agent profile created successfully',
            agent,
        })
    } catch (error: any) {
        console.error('Create agent profile error:', error)
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        )
    }
}

/**
 * GET endpoint to find users who are agents but don't have agent profiles
 */
export async function GET() {
    try {
        const supabase = createSupabaseAdminClient()

        // Get all users with user_type = 'agent'
        const { data: agentUsers, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('user_type', 'agent')

        if (usersError) {
            throw usersError
        }

        // Get all agent profiles
        const { data: agentProfiles, error: agentsError } = await supabase
            .from('agents')
            .select('user_id')

        if (agentsError) {
            throw agentsError
        }

        const agentProfileUserIds = new Set(agentProfiles?.map(a => a.user_id) || [])

        // Find users without agent profiles
        const missingProfiles = agentUsers?.filter(user => !agentProfileUserIds.has(user.id)) || []

        return NextResponse.json({
            success: true,
            missingProfiles,
            count: missingProfiles.length,
        })
    } catch (error: any) {
        console.error('Get missing profiles error:', error)
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        )
    }
}
