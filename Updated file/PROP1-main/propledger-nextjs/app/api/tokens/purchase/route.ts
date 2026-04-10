import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is an agent - agents cannot purchase tokens
    if (authResult.user.type === 'agent') {
      return NextResponse.json(
        { success: false, error: 'Agents are not allowed to purchase tokens' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tokenAmount, paymentMethod, paymentReference } = body;

    // Validate input
    if (!tokenAmount || tokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid token amount' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Get payment method details
    const paymentMethods = await db.getPaymentMethods();
    const selectedMethod = paymentMethods.find(m => m.method_name === paymentMethod);
    
    if (!selectedMethod) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Calculate PKR amount (1 PROP token = 1000 PKR)
    const TOKEN_RATE = 1000;
    const baseAmount = tokenAmount * TOKEN_RATE;
    const processingFee = (baseAmount * selectedMethod.processing_fee_percent) / 100;
    const totalAmount = baseAmount + processingFee;

    // Validate amount limits
    if (totalAmount < selectedMethod.min_amount || totalAmount > selectedMethod.max_amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Amount must be between PKR ${selectedMethod.min_amount.toLocaleString()} and PKR ${selectedMethod.max_amount.toLocaleString()}` 
        },
        { status: 400 }
      );
    }

    // Create transaction record
    const transactionId = await db.createTokenTransaction({
      user_id: authResult.user.id,
      transaction_type: 'purchase',
      token_amount: tokenAmount,
      pkr_amount: totalAmount,
      payment_method: paymentMethod,
      payment_reference: paymentReference || `TXN-${Date.now()}`,
      description: `Purchase of ${tokenAmount} PROP tokens via ${selectedMethod.display_name}`
    });

    // For demo purposes, we'll simulate different payment processing
    let status = 'pending';
    let message = 'Transaction created successfully';

    // Simulate instant completion for some payment methods
    if (paymentMethod === 'crypto_usdt' || paymentMethod === 'crypto_btc') {
      // Crypto payments - simulate blockchain confirmation delay
      setTimeout(async () => {
        await db.updateTransactionStatus(transactionId, 'completed');
      }, 5000); // 5 second delay
      message = 'Crypto payment initiated. Waiting for blockchain confirmation...';
    } else if (paymentMethod === 'bank_transfer') {
      // Bank transfer - manual verification required
      message = 'Bank transfer initiated. Please allow 1-2 business days for verification.';
    } else {
      // Credit card, mobile wallets - instant processing for demo
      await db.updateTransactionStatus(transactionId, 'completed');
      status = 'completed';
      message = 'Payment processed successfully! Tokens added to your account.';
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transactionId,
        tokenAmount,
        pkrAmount: totalAmount,
        processingFee,
        paymentMethod: selectedMethod.display_name,
        status,
        message
      }
    });

  } catch (error) {
    console.error('Token purchase error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
