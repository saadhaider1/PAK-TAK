'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
    price: string;
    priceNumeric: number;
    minInvestment?: number;
    type: 'property' | 'crowdfunding' | 'investment';
  };
}

export default function InvestmentModal({ isOpen, onClose, property }: InvestmentModalProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<'full' | 'fractional' | 'rent'>('full');

  if (!isOpen) return null;

  const handleViewDetails = () => {
    // Close modal first
    onClose();
    // Navigate to detail page based on type
    const basePath = property.type === 'property' ? 'properties' : 
                     property.type === 'crowdfunding' ? 'crowdfunding' : 'investments';
    // Use setTimeout to ensure modal closes before navigation
    setTimeout(() => {
      router.push(`/${basePath}/${property.id}`);
    }, 100);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold text-center">{property.title}</h2>
          <p className="text-center text-blue-100 mt-1">Choose your investment option</p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Full Ownership */}
          <button
            onClick={() => setSelectedOption('full')}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedOption === 'full'
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                selectedOption === 'full'
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300'
              }`}>
                {selectedOption === 'full' && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🏠</span>
                  <span className="font-bold text-gray-900">Full Ownership</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Purchase 100% ownership</p>
                <p className="text-lg font-bold text-blue-600">{property.price}</p>
              </div>
            </div>
          </button>

          {/* Fractional Shares */}
          <button
            onClick={() => setSelectedOption('fractional')}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedOption === 'fractional'
                ? 'border-green-600 bg-green-50 shadow-md'
                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                selectedOption === 'fractional'
                  ? 'border-green-600 bg-green-600'
                  : 'border-gray-300'
              }`}>
                {selectedOption === 'fractional' && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">📊</span>
                  <span className="font-bold text-gray-900">Fractional Shares</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Buy fractional ownership starting from {property.minInvestment ? `PKR ${property.minInvestment.toLocaleString()}` : 'PKR 100,000'}
                </p>
              </div>
            </div>
          </button>

          {/* Rent-to-Own */}
          <button
            onClick={() => setSelectedOption('rent')}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedOption === 'rent'
                ? 'border-purple-600 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                selectedOption === 'rent'
                  ? 'border-purple-600 bg-purple-600'
                  : 'border-gray-300'
              }`}>
                {selectedOption === 'rent' && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🔑</span>
                  <span className="font-bold text-gray-900">Rent-to-Own</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Monthly payments with ownership option</p>
              </div>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleViewDetails}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
