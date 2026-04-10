import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// 1 PROP token = 1000 PKR
const TOKEN_RATE_PK = 1000;

export async function GET(request: NextRequest) {
  try {
    // Verify authentication using the custom session system
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Agents do not maintain token balances
    if (authResult.user.type === 'agent') {
      return NextResponse.json(
        {
          success: true,
          tokens: {
            balance: 0,
            totalPurchased: 0,
            totalSpent: 0,
            pkrValue: 0,
            lastPurchase: null,
          },
        },
        { status: 200 }
      );
    }

    // Load user's token record; if none exists yet, create a zero-balance row
    let userTokens = await db.getUserTokens(authResult.user.id);

    if (!userTokens) {
      userTokens = await db.createOrUpdateUserTokens(authResult.user.id);
    }

    const balance = userTokens.token_balance || 0;
    const totalPurchased = userTokens.total_purchased || 0;
    const totalSpent = userTokens.total_spent || 0;
    const pkrValue = balance * TOKEN_RATE_PK;

    return NextResponse.json({
      success: true,
      tokens: {
        balance,
        totalPurchased,
        totalSpent,
        pkrValue,
        lastPurchase: userTokens.last_purchase_at || null,
      },
    });
  } catch (error) {
    console.error('Token balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
