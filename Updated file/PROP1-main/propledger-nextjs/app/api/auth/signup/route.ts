import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      password,
      userType,
      country,
      city,
      licenseNumber,
      experience,
      specialization,
      agency,
      newsletter,
    } = body

    if (!fullName || !email || !phone || !password || !userType) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()

    // First, disable the trigger temporarily by setting user_metadata flag
    // The trigger checks for this flag and skips auto-creation
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        phone,
        country: country || city,
        user_type: userType,
        skip_auto_profile: true, // Flag to skip trigger
      },
    })

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        {
          success: false,
          message: authError?.message || 'Failed to create account',
        },
        { status: 400 }
      )
    }

    console.log('Auth user created with ID:', authData.user.id)

    // Create user profile in public.users table manually
    const { data: profileData, error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      full_name: fullName,
      email,
      phone,
      country: country || city || 'Pakistan',
      user_type: userType,
      newsletter_subscribed: newsletter || false,
    }).select()

    if (profileError) {
      console.error('Profile creation error:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
        userId: authData.user.id,
      })
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create user profile',
          debug: {
            error: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          }
        },
        { status: 500 }
      )
    }

    console.log('Profile created successfully:', profileData)

    // If agent, create agent profile
    if (userType === 'agent') {
      const { error: agentError } = await supabase.from('agents').insert({
        user_id: authData.user.id,
        license_number: licenseNumber,
        experience,
        specialization,
        city: city || 'Unknown',
        agency: agency || null,
        phone,
        status: 'pending', // Requires admin approval
      })

      if (agentError) {
        console.error('Agent profile creation error:', agentError)
        // Don't fail the signup, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: userType === 'agent'
        ? 'Account created successfully! Your agent registration is pending admin approval. You will be notified once approved.'
        : 'Account created successfully! Please login.',
      user: {
        id: authData.user.id,
        email,
        full_name: fullName,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
