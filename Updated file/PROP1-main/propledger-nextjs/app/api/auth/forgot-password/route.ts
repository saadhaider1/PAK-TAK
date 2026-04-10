import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { z } from 'zod';

const schema = z.object({
    email: z.string().email(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = schema.parse(body);

        // Check if user exists using db helper
        const user = await db.getUserByEmail(email);

        if (!user) {
            // Return success even if user doesn't exist to prevent enumeration
            return NextResponse.json({
                success: true,
                message: 'If an account exists, a PIN has been sent.'
            });
        }

        // Generate 6-digit PIN
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store PIN in Supabase
        const supabase = createSupabaseAdminClient();

        // Upsert (insert or update) the password reset record
        const { error: upsertError } = await supabase
            .from('password_resets')
            .upsert({
                email,
                token: pin,
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString()
            }, {
                onConflict: 'email'
            });

        if (upsertError) {
            console.error('Database error:', upsertError);
            throw new Error('Failed to store reset token');
        }

        // For now, just log the PIN (in production, you'd send an email)
        console.log(`Password reset PIN for ${email}: ${pin}`);
        console.log(`PIN expires at: ${expiresAt.toISOString()}`);

        // TODO: Uncomment when email service is configured
        // try {
        //     await sendPasswordResetEmail(email, pin);
        //     console.log(`Password reset PIN sent to ${email}`);
        // } catch (emailError: any) {
        //     console.error('Email service error:', emailError);
        //     return NextResponse.json({
        //         success: false,
        //         error: `Failed to send email: ${emailError.message}`
        //     }, { status: 500 });
        // }

        return NextResponse.json({
            success: true,
            message: `PIN sent successfully. For testing: ${pin}` // Remove in production
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid email address'
            }, { status: 400 });
        }
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
