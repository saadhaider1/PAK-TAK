import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'user_id is required' },
                { status: 400 }
            );
        }

        const investments = await db.getUserInvestments(userId);

        return NextResponse.json({
            success: true,
            investments,
            count: investments.length
        });

    } catch (error) {
        console.error('Get investments error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to fetch investments' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { property_id, user_id, tokens_purchased, total_amount } = body;

        // Validate required fields
        if (!property_id || !user_id || !tokens_purchased || !total_amount) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate tokens_purchased is positive
        if (tokens_purchased <= 0) {
            return NextResponse.json(
                { success: false, message: 'tokens_purchased must be greater than 0' },
                { status: 400 }
            );
        }

        const investment = await db.createInvestment({
            property_id,
            user_id,
            tokens_purchased,
            total_amount
        });

        return NextResponse.json({
            success: true,
            investment,
            message: 'Investment created successfully'
        });

    } catch (error) {
        console.error('Create investment error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to create investment' },
            { status: 500 }
        );
    }
}
