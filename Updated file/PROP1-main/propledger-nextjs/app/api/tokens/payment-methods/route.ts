import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get all active payment methods
    const paymentMethods = await db.getPaymentMethods();

    return NextResponse.json({
      success: true,
      paymentMethods: paymentMethods.map(method => ({
        id: method.id,
        name: method.method_name,
        displayName: method.display_name,
        processingFee: method.processing_fee_percent,
        minAmount: method.min_amount,
        maxAmount: method.max_amount,
        icon: getPaymentMethodIcon(method.method_name)
      }))
    });

  } catch (error) {
    console.error('Payment methods error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getPaymentMethodIcon(methodName: string): string {
  const icons: { [key: string]: string } = {
    'credit_card': '💳',
    'bank_transfer': '🏦',
    'bank_hbl': '🏛️',
    'bank_ubl': '🏛️',
    'bank_mcb': '🏛️',
    'bank_allied': '🏛️',
    'easypaisa': '📱',
    'jazzcash': '📱',
    'sadapay': '💙',
    'nayapay': '💚',
    'crypto_usdt': '₮',
    'crypto_btc': '₿'
  };
  return icons[methodName] || '💰';
}
