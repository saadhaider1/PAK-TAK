import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const schema = z.object({
  email: z.string().email(),
  pin: z.string().length(6),
  newPassword: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, pin, newPassword } = schema.parse(body);

    console.log('Reset password request for:', email);

    const supabase = createSupabaseAdminClient();

    // Verify PIN exists and not expired
    const { data: resetRecord, error: verifyError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .eq('token', pin)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (verifyError || !resetRecord) {
      console.log('PIN verification failed:', verifyError);
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired PIN'
      }, { status: 400 });
    }

    console.log('PIN verified successfully');

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    console.log('User found, hashing password...');

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('Password hashed, updating database...');

    // Update password in users table
    const { error: passwordError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('email', email);

    if (passwordError) {
      console.error('Password update error:', passwordError);
      return NextResponse.json({
        success: false,
        message: `Failed to update password: ${passwordError.message}`
      }, { status: 500 });
    }

    console.log('Password updated successfully, deleting PIN...');

    // Delete reset token
    const { error: deleteError } = await supabase
      .from('password_resets')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.error('Error deleting PIN:', deleteError);
      // Don't fail the request if PIN deletion fails
    }

    console.log('Password reset completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
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
