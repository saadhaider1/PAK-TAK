'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import { useWallet } from '@/context/WalletContext';

interface PaymentMethod {
  id: number;
  name: string;
  displayName: string;
  processingFee: number;
  minAmount: number;
  maxAmount: number;
  icon: string;
}

interface TokenBalance {
  balance: number;
  totalPurchased: number;
  totalSpent: number;
  pkrValue: number;
  lastPurchase?: string;
}

export default function BuyTokensPage() {
  const router = useRouter();
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);

  // Form state
  const [tokenAmount, setTokenAmount] = useState<number>(10);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Constants
  const TOKEN_RATE = 1000; // 1 PROP = 1000 PKR

  useEffect(() => {
    checkAuth();
    loadPaymentMethods();
    loadTokenBalance();
    // Wallet connection check is now handled by Context!
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);

        // Check if user is an agent - agents cannot buy tokens
        if (userData.user_type === 'agent' || userData.type === 'agent') {
          router.push('/agent-dashboard');
          return;
        }

        setUser(userData);
      } else {
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/tokens/payment-methods');
      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.paymentMethods);
        if (data.paymentMethods.length > 0) {
          setSelectedPayment(data.paymentMethods[0].name);
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadTokenBalance = async () => {
    try {
      const response = await fetch('/api/tokens/balance');
      const data = await response.json();

      if (data.success) {
        setTokenBalance(data.tokens);
      }
    } catch (error) {
      console.error('Error loading token balance:', error);
    }
  };

  const calculateTotal = () => {
    const selectedMethod = paymentMethods.find(m => m.name === selectedPayment);
    if (!selectedMethod) return { baseAmount: 0, processingFee: 0, total: 0 };

    const baseAmount = tokenAmount * TOKEN_RATE;
    const processingFee = (baseAmount * selectedMethod.processingFee) / 100;
    const total = baseAmount + processingFee;

    return { baseAmount, processingFee, total };
  };

  const handlePurchase = async () => {
    setError('');
    setSuccess('');
    setPurchasing(true);

    try {
      const response = await fetch('/api/tokens/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAmount,
          paymentMethod: selectedPayment,
          paymentReference: paymentReference || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.transaction.message);
        setTokenAmount(10);
        setPaymentReference('');
        loadTokenBalance(); // Refresh balance

        // Redirect to dashboard after success
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setError(data.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError('Network error. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const { baseAmount, processingFee, total } = calculateTotal();
  const selectedMethod = paymentMethods.find(m => m.name === selectedPayment);

  // Helper function to get bank account details
  const getBankAccountDetails = (bankMethod: string) => {
    const bankDetails: { [key: string]: any } = {
      'bank_transfer': {
        name: 'PROPLEDGER Technologies',
        account: '1234567890123',
        bank: 'Standard Chartered Bank',
        branch: 'Gulberg Branch, Lahore',
        iban: 'PK36SCBL0000001234567890'
      },
      'bank_hbl': {
        name: 'PROPLEDGER Technologies',
        account: '2345678901234',
        bank: 'Habib Bank Limited (HBL)',
        branch: 'Main Branch, Karachi',
        iban: 'PK31HABB0023456789012345'
      },
      'bank_ubl': {
        name: 'PROPLEDGER Technologies',
        account: '3456789012345',
        bank: 'United Bank Limited (UBL)',
        branch: 'DHA Branch, Lahore',
        iban: 'PK47UNIL0109000345678901'
      },
      'bank_mcb': {
        name: 'PROPLEDGER Technologies',
        account: '4567890123456',
        bank: 'Muslim Commercial Bank (MCB)',
        branch: 'Gulshan Branch, Karachi',
        iban: 'PK70MUCB0000456789012345'
      },
      'bank_allied': {
        name: 'PROPLEDGER Technologies',
        account: '5678901234567',
        bank: 'Allied Bank Limited',
        branch: 'Model Town Branch, Lahore',
        iban: 'PK19ABPA0000567890123456'
      }
    };

    const details = bankDetails[bankMethod];
    if (!details) return null;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Account Title:</span>
            <div className="text-blue-700">{details.name}</div>
          </div>
          <div>
            <span className="font-medium text-blue-800">Account Number:</span>
            <div className="text-blue-700 font-mono">{details.account}</div>
          </div>
          <div>
            <span className="font-medium text-blue-800">Bank:</span>
            <div className="text-blue-700">{details.bank}</div>
          </div>
          <div>
            <span className="font-medium text-blue-800">Branch:</span>
            <div className="text-blue-700">{details.branch}</div>
          </div>
        </div>
        <div className="pt-2 border-t border-blue-200">
          <span className="font-medium text-blue-800">IBAN:</span>
          <div className="text-blue-700 font-mono text-lg">{details.iban}</div>
        </div>
        <div className="bg-blue-100 p-3 rounded text-sm text-blue-800">
          <strong>Instructions:</strong> Transfer PKR {total.toLocaleString()} to the above account and use your email as reference. Processing time: 1-2 business days.
        </div>
      </div>
    );
  };

  // Helper function for digital wallet instructions
  const getDigitalWalletInstructions = (method: string) => {
    const instructions: { [key: string]: any } = {
      'easypaisa': {
        number: '03001234567',
        name: 'PROPLEDGER Tech',
        steps: ['Open EasyPaisa app', 'Select Send Money', 'Enter account: 03001234567', 'Amount: PKR ' + total.toLocaleString(), 'Reference: Your email']
      },
      'jazzcash': {
        number: '03211234567',
        name: 'PROPLEDGER Tech',
        steps: ['Open JazzCash app', 'Select Money Transfer', 'Enter account: 03211234567', 'Amount: PKR ' + total.toLocaleString(), 'Reference: Your email']
      },
      'sadapay': {
        number: '03451234567',
        name: 'PROPLEDGER Tech',
        steps: ['Open SadaPay app', 'Select Send Money', 'Enter account: 03451234567', 'Amount: PKR ' + total.toLocaleString(), 'Reference: Your email']
      },
      'nayapay': {
        number: '03331234567',
        name: 'PROPLEDGER Tech',
        steps: ['Open NayaPay app', 'Select Transfer', 'Enter account: 03331234567', 'Amount: PKR ' + total.toLocaleString(), 'Reference: Your email']
      }
    };

    const info = instructions[method];
    if (!info) return null;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-green-800">Account:</span>
            <div className="text-green-700 font-mono text-lg">{info.number}</div>
          </div>
          <div>
            <span className="font-medium text-green-800">Account Name:</span>
            <div className="text-green-700">{info.name}</div>
          </div>
        </div>
        <div>
          <span className="font-medium text-green-800">Steps:</span>
          <ol className="list-decimal list-inside text-green-700 text-sm mt-1 space-y-1">
            {info.steps.map((step: string, index: number) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    );
  };

  // Helper function for crypto instructions
  const getCryptoInstructions = (method: string) => {
    const cryptoDetails: { [key: string]: any } = {
      'crypto_usdt': {
        address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
        network: 'TRON (TRC20)',
        amount: (total / 280).toFixed(6) + ' USDT' // Assuming 1 USDT = 280 PKR
      },
      'crypto_btc': {
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        network: 'Bitcoin Network',
        amount: (total / 12500000).toFixed(8) + ' BTC' // Assuming 1 BTC = 12.5M PKR
      }
    };

    const details = cryptoDetails[method];
    if (!details) return null;

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <span className="font-medium text-purple-800">Wallet Address:</span>
            <div className="text-purple-700 font-mono text-xs bg-purple-100 p-2 rounded break-all">{details.address}</div>
          </div>
          <div>
            <span className="font-medium text-purple-800">Network:</span>
            <div className="text-purple-700">{details.network}</div>
          </div>
          <div>
            <span className="font-medium text-purple-800">Amount to Send:</span>
            <div className="text-purple-700 text-lg font-semibold">{details.amount}</div>
          </div>
        </div>
        <div className="bg-purple-100 p-3 rounded text-sm text-purple-800">
          <strong>Important:</strong> Send the exact amount to the address above. Include your email in the transaction memo if possible. Confirmation time: 5-10 minutes.
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <LoadingScreen />
      <div className="min-h-screen bg-gray-950">
        <Navbar user={user} />

        <div className="pt-20 pb-12">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent mb-4">
                Buy PROP Tokens
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Purchase PROP tokens to invest in tokenized real estate properties.
                Each token represents PKR 1,000 worth of investment power.
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Token Balance Card */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-teal-900/50 to-blue-900/50 rounded-2xl p-6 border border-teal-500/30 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    Your Token Balance
                  </h3>

                  {tokenBalance && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-teal-400 mb-2">
                          {tokenBalance.balance.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-300">PROP Tokens</div>
                        <div className="text-lg text-white mt-1">
                          ≈ PKR {tokenBalance.pkrValue.toLocaleString()}
                        </div>
                      </div>

                      <div className="border-t border-gray-600 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Purchased:</span>
                          <span className="text-white">{tokenBalance.totalPurchased.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Total Spent:</span>
                          <span className="text-white">{tokenBalance.totalSpent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-8 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Purchase Tokens</h2>
                    <button
                      onClick={walletAddress ? disconnectWallet : connectWallet}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${walletAddress
                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 group'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                    >
                      <span className="text-xl">
                        {walletAddress ? (
                          <>
                            <span className="group-hover:hidden">✅</span>
                            <span className="hidden group-hover:inline">🚪</span>
                          </>
                        ) : '🦊'}
                      </span>
                      <span className="text-sm">
                        {walletAddress
                          ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                          : 'Connect Wallet'
                        }
                      </span>
                    </button>
                  </div>

                  {/* Token Amount */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of PROP Tokens
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter token amount"
                      />
                      <div className="absolute right-3 top-3 text-gray-500 text-sm">
                        PROP
                      </div>
                    </div>

                    {/* Quick Select Buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[10, 50, 100, 500, 1000].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setTokenAmount(amount)}
                          className={`px-3 py-1 text-sm rounded-full border transition-all ${tokenAmount === amount
                            ? 'bg-teal-50 border-teal-500 text-teal-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-600'
                            }`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>

                    <div className="text-sm text-gray-500 mt-2">
                      1 PROP Token = PKR 1,000
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPayment === method.name
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.name}
                            checked={selectedPayment === method.name}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="sr-only"
                          />
                          <span className="text-2xl mr-3">{method.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{method.displayName}</div>
                            <div className="text-sm text-gray-500">
                              {method.processingFee}% fee
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              PKR {method.minAmount.toLocaleString()} - {method.maxAmount.toLocaleString()}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Bank Account Details - Show when bank method is selected */}
                  {selectedPayment && selectedPayment.startsWith('bank_') && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                        <span>🏛️</span>
                        Bank Account Details
                      </h4>
                      {getBankAccountDetails(selectedPayment)}
                    </div>
                  )}

                  {/* Digital Wallet Instructions */}
                  {selectedPayment && ['easypaisa', 'jazzcash', 'sadapay', 'nayapay'].includes(selectedPayment) && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                        <span>📱</span>
                        Payment Instructions
                      </h4>
                      {getDigitalWalletInstructions(selectedPayment)}
                    </div>
                  )}

                  {/* Crypto Wallet Instructions */}
                  {selectedPayment && selectedPayment.startsWith('crypto_') && (
                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                        <span>₿</span>
                        Crypto Payment Instructions
                      </h4>
                      {getCryptoInstructions(selectedPayment)}
                    </div>
                  )}

                  {/* Payment Reference (Optional) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Enter transaction ID or reference"
                    />
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Cost Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {tokenAmount.toLocaleString()} PROP Tokens
                        </span>
                        <span className="text-gray-900">
                          PKR {baseAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Processing Fee ({selectedMethod?.processingFee}%)
                        </span>
                        <span className="text-gray-900">
                          PKR {processingFee.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-900">Total Amount</span>
                          <span className="text-teal-600 text-lg">
                            PKR {total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-red-800">{error}</div>
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-green-800">{success}</div>
                    </div>
                  )}

                  {/* Purchase Button */}
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || tokenAmount <= 0 || !selectedPayment}
                    className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {purchasing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing Purchase...
                      </div>
                    ) : (
                      `Purchase ${tokenAmount.toLocaleString()} PROP Tokens`
                    )}
                  </button>

                  {/* Security Notice */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500 text-lg">🛡️</span>
                      <div className="text-sm text-blue-800">
                        <strong>Secure Transaction:</strong> All payments are processed through
                        encrypted channels and recorded on the blockchain for transparency and security.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
