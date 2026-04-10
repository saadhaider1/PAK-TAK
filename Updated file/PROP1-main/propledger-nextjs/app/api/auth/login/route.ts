import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient, createSupabaseClient } from '@/lib/supabase';
import { createSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    loginType: z.enum(['user', 'agent']).optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Login attempt for:', body.email, 'as', body.loginType);

        const { email, password, loginType } = loginSchema.parse(body);

        const supabaseAdmin = createSupabaseAdminClient();
        const supabaseClient = createSupabaseClient();

        // Authenticate with Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.user) {
            console.log('Supabase auth failed:', authError?.message);
            return NextResponse.json({
                success: false,
                message: 'Invalid email or password'
            }, { status: 401 });
        }

        console.log('Supabase auth successful for:', email);

        // Get user profile from database
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError || !user) {
            console.log('User profile not found:', email);
            return NextResponse.json({
                success: false,
                message: 'User profile not found. Please contact support.'
            }, { status: 401 });
        }

        console.log('User found:', user.email, 'with user_type:', user.user_type);

        // Validate login type matches user type
        if (loginType === 'agent') {
            // Agent login - user must have user_type = 'agent'
            if (user.user_type !== 'agent') {
                console.log('User is not an agent:', email, 'user_type:', user.user_type);
                return NextResponse.json({
                    success: false,
                    message: 'Invalid email or password'
                }, { status: 401 });
            }

            // Verify agent is approved in agents table
            const { data: agent, error: agentError } = await supabaseAdmin
                .from('agents')
                .select('status')
                .eq('user_id', user.id)
                .single();

            if (agentError || !agent) {
                console.log('Agent record not found for user:', email);
                return NextResponse.json({
                    success: false,
                    message: 'Agent account not found. Please contact support.'
                }, { status: 401 });
            }

            if (agent.status !== 'approved') {
                console.log('Agent not approved:', email, 'status:', agent.status);
                return NextResponse.json({
                    success: false,
                    message: agent.status === 'pending'
                        ? 'Your agent account is pending admin approval. Please wait for approval before logging in.'
                        : agent.status === 'rejected'
                            ? 'Your agent account has been rejected. Please contact support for more information.'
                            : `Your agent account status is ${agent.status}. Please contact support.`
                }, { status: 401 });
            }

            console.log('Agent verified and approved:', email);
        } else if (loginType === 'user') {
            // User login - user must NOT be an agent
            if (user.user_type === 'agent') {
                console.log('Agent trying to login as user:', email);
                return NextResponse.json({
                    success: false,
                    message: 'Please use the agent login portal.'
                }, { status: 401 });
            }
        }

        // Create session
        console.log('Creating session for user:', user.id);
        await createSession(user);

        console.log('Login successful for:', email);

        // Determine redirect URL based on user type
        let redirectUrl = '/dashboard';
        if (user.user_type === 'agent') {
            redirectUrl = '/agent-dashboard';
        }

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            redirect: redirectUrl,
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                type: user.user_type,
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                message: 'Invalid input data'
            }, { status: 400 });
        }
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
