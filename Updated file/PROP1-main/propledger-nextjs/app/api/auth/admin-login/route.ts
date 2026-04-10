import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Admin credentials - in production, store these securely in environment variables
const ADMIN_CREDENTIALS = {
    email: process.env.ADMIN_EMAIL || 'admin@123',
    // Default password hash for 'ADMIN123'
    passwordHash: process.env.ADMIN_PASSWORD_HASH || '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQCOVBZbT.3Ecu6VKx7LqWe3bQnbDe'
};

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({
                success: false,
                message: 'Email and password are required'
            }, { status: 400 });
        }

        // Check if it's the admin email
        if (email.toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase()) {
            return NextResponse.json({
                success: false,
                message: 'Invalid admin credentials'
            }, { status: 401 });
        }

        // Verify password
        // For simplicity, also allow plain text comparison with env var
        const envPassword = process.env.ADMIN_PASSWORD || 'ADMIN123';
        const isValidPassword = password === envPassword ||
            await bcrypt.compare(password, ADMIN_CREDENTIALS.passwordHash);

        if (!isValidPassword) {
            return NextResponse.json({
                success: false,
                message: 'Invalid admin credentials'
            }, { status: 401 });
        }

        // Also check if admin exists in users table with admin type
        const supabase = createSupabaseAdminClient();
        const { data: adminUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('user_type', 'admin')
            .single();

        // Return success with admin info
        return NextResponse.json({
            success: true,
            message: 'Admin login successful',
            user: adminUser || {
                id: 'admin',
                email: email,
                full_name: 'System Administrator',
                user_type: 'admin'
            },
            redirect: '/admin/dashboard'
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json({
            success: false,
            message: 'An error occurred during login'
        }, { status: 500 });
    }
}
