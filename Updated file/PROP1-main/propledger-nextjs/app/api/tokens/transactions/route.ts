import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is an agent - agents don't have token transactions
    if (authResult.user.type === 'agent') {
      return NextResponse.json(
        { success: false, error: 'Agents do not have token transactions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user transactions
    const transactions = await db.getUserTransactions(authResult.user.id, limit);

    return NextResponse.json({
      success: true,
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.transaction_type,
        tokenAmount: tx.token_amount,
        pkrAmount: tx.pkr_amount,
        paymentMethod: tx.payment_method,
        status: tx.status,
        description: tx.description,
        createdAt: tx.created_at,
        completedAt: tx.completed_at
      }))
    });

  } catch (error) {
    console.error('Token transactions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
