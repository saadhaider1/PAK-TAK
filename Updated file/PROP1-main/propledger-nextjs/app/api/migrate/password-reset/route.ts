import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export async function GET() {
    try {
        const supabase = createSupabaseAdminClient();

        console.log('Checking if password_resets table exists...');

        // Try to query the table - if it doesn't exist, we'll get an error
        const { error: checkError } = await supabase
            .from('password_resets')
            .select('email')
            .limit(1);

        if (checkError) {
            return NextResponse.json({
                success: false,
                tableExists: false,
                message: 'Password resets table does NOT exist in Supabase',
                instructions: 'Please run the migration SQL in Supabase dashboard',
                sql: `
-- Run this in Supabase SQL Editor:

-- Add password_hash column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Create password_resets table
CREATE TABLE IF NOT EXISTS public.password_resets (
    email VARCHAR(255) NOT NULL PRIMARY KEY,
    token VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON public.password_resets(expires_at);

-- Enable RLS
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Service role can manage password resets" ON public.password_resets;
CREATE POLICY "Service role can manage password resets" ON public.password_resets
    FOR ALL USING (true);
                `.trim()
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            tableExists: true,
            message: 'Password resets table exists! Password reset should work now.'
        });

    } catch (error) {
        console.error('Check error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
