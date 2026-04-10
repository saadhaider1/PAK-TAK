'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  id: number;
  type: 'purchase' | 'spend' | 'refund';
  tokenAmount: number;
  pkrAmount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  createdAt: string;
  completedAt?: string;
}

export default function TokenTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/tokens/transactions?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      } else {
        setError(data.error || 'Failed to load transactions');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '🛒';
      case 'spend': return '💸';
      case 'refund': return '↩️';
      default: return '💰';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
        <button 
          onClick={loadTransactions}
          className="text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-600">No transactions yet</p>
          <p className="text-gray-500 text-sm mt-1">Your token purchases will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg">
                {getTypeIcon(tx.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 capitalize">
                    {tx.type} {tx.tokenAmount.toLocaleString()} Tokens
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {tx.description || `${tx.paymentMethod} • ${formatDate(tx.createdAt)}`}
                </p>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  PKR {tx.pkrAmount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {tx.tokenAmount.toLocaleString()} PROP
                </div>
              </div>
            </div>
          ))}
          
          {transactions.length >= 10 && (
            <div className="text-center pt-4">
              <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                View All Transactions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
