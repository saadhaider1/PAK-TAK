import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase';

const schema = z.object({
    email: z.string().email(),
    pin: z.string().length(6),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, pin } = schema.parse(body);

        const supabase = createSupabaseAdminClient();

        // Verify PIN exists and not expired
        const { data, error } = await supabase
            .from('password_resets')
            .select('*')
            .eq('email', email)
            .eq('token', pin)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !data) {
            console.log('PIN verification failed:', error);
            return NextResponse.json({
                valid: false,
                message: 'Invalid or expired PIN'
            }, { status: 400 });
        }

        return NextResponse.json({
            valid: true,
            message: 'PIN verified successfully'
        });

    } catch (error) {
        console.error('Verify PIN error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                valid: false,
                message: 'Invalid PIN format'
            }, { status: 400 });
        }
        return NextResponse.json({
            valid: false,
            message: 'Internal server error'
        }, { status: 500 });
    }
}
