import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid investment ID' },
                { status: 400 }
            );
        }

        const investment = await db.getInvestmentById(id);

        if (!investment) {
            return NextResponse.json(
                { success: false, message: 'Investment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            investment
        });

    } catch (error) {
        console.error('Get investment error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to fetch investment' },
            { status: 500 }
        );
    }
}
