/**
 * Test script to verify Supabase connection and schema
 * Run with: npx ts-node scripts/test-supabase-connection.ts
 */

import { createSupabaseAdminClient } from '../lib/supabase'

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection...\n')

    try {
        const supabase = createSupabaseAdminClient()
        console.log('✅ Supabase client created successfully\n')

        // Test 1: Check if users table exists
        console.log('📋 Test 1: Checking users table...')
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1)

        if (usersError) {
            console.error('❌ Users table error:', usersError.message)
            console.error('   Details:', usersError)
        } else {
            console.log('✅ Users table exists and is accessible')
            console.log('   Sample data:', usersData)
        }

        // Test 2: Check if agents table exists
        console.log('\n📋 Test 2: Checking agents table...')
        const { data: agentsData, error: agentsError } = await supabase
            .from('agents')
            .select('*')
            .limit(1)

        if (agentsError) {
            console.error('❌ Agents table error:', agentsError.message)
            console.error('   Details:', agentsError)
        } else {
            console.log('✅ Agents table exists and is accessible')
            console.log('   Sample data:', agentsData)
        }

        // Test 3: Try to insert a test user
        console.log('\n📋 Test 3: Testing user insert...')
        const testUserId = 'test-' + Date.now()
        const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert({
                id: testUserId,
                full_name: 'Test User',
                email: `test${Date.now()}@example.com`,
                phone: '+92300000000',
                country: 'Pakistan',
                user_type: 'investor',
                newsletter_subscribed: false,
            })
            .select()

        if (insertError) {
            console.error('❌ Insert test failed:', insertError.message)
            console.error('   Code:', insertError.code)
            console.error('   Details:', insertError.details)
            console.error('   Hint:', insertError.hint)
        } else {
            console.log('✅ Insert test successful')
            console.log('   Inserted data:', insertData)

            // Clean up test data
            await supabase.from('users').delete().eq('id', testUserId)
            console.log('✅ Test data cleaned up')
        }

        console.log('\n✅ All tests completed!')
    } catch (error: any) {
        console.error('\n❌ Fatal error:', error.message)
        console.error('   Stack:', error.stack)
    }
}

testSupabaseConnection()
