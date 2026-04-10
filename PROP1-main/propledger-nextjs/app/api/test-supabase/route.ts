import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    const results: any = {
        timestamp: new Date().toISOString(),
        tests: [],
    }

    try {
        const supabase = createSupabaseAdminClient()
        results.tests.push({ name: 'Client Creation', status: 'PASS', message: 'Supabase client created successfully' })

        // Test 1: Check if users table exists
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1)

        if (usersError) {
            results.tests.push({
                name: 'Users Table Check',
                status: 'FAIL',
                error: usersError.message,
                code: usersError.code,
                details: usersError.details,
                hint: usersError.hint,
            })
        } else {
            results.tests.push({
                name: 'Users Table Check',
                status: 'PASS',
                message: 'Users table exists and is accessible',
                sampleData: usersData,
            })
        }

        // Test 2: Check if agents table exists
        const { data: agentsData, error: agentsError } = await supabase
            .from('agents')
            .select('*')
            .limit(1)

        if (agentsError) {
            results.tests.push({
                name: 'Agents Table Check',
                status: 'FAIL',
                error: agentsError.message,
                code: agentsError.code,
                details: agentsError.details,
            })
        } else {
            results.tests.push({
                name: 'Agents Table Check',
                status: 'PASS',
                message: 'Agents table exists and is accessible',
                sampleData: agentsData,
            })
        }

        // Test 3: Try to insert a test user
        const testUserId = 'test-' + Date.now()
        const testEmail = `test${Date.now()}@example.com`
        const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert({
                id: testUserId,
                full_name: 'Test User',
                email: testEmail,
                phone: '+92300000000',
                country: 'Pakistan',
                user_type: 'investor',
                newsletter_subscribed: false,
            })
            .select()

        if (insertError) {
            results.tests.push({
                name: 'User Insert Test',
                status: 'FAIL',
                error: insertError.message,
                code: insertError.code,
                details: insertError.details,
                hint: insertError.hint,
            })
        } else {
            results.tests.push({
                name: 'User Insert Test',
                status: 'PASS',
                message: 'Successfully inserted test user',
                insertedData: insertData,
            })

            // Clean up test data
            await supabase.from('users').delete().eq('id', testUserId)
            results.tests.push({
                name: 'Cleanup Test',
                status: 'PASS',
                message: 'Test data cleaned up successfully',
            })
        }

        // Test 4: Check environment variables
        results.tests.push({
            name: 'Environment Variables',
            status: 'INFO',
            variables: {
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing',
            },
        })

        return NextResponse.json(results, { status: 200 })
    } catch (error: any) {
        results.tests.push({
            name: 'Fatal Error',
            status: 'FAIL',
            error: error.message,
            stack: error.stack,
        })
        return NextResponse.json(results, { status: 500 })
    }
}
