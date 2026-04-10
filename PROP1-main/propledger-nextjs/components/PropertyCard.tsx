'use client';

import { useState } from 'react';
import Image from 'next/image';
import InvestmentModal from './InvestmentModal';

interface PropertyCardProps {
  id: string;
  image: string;
  logo?: string;
  icon?: string;
  title: string;
  category: string;
  location: string;
  description: string;
  price?: string;
  targetAmount?: string;
  raisedAmount?: string;
  investors?: number;
  minInvestment?: string;
  returns?: string;
  duration?: string;
  type?: 'property' | 'crowdfunding' | 'investment';
}

export default function PropertyCard({
  id,
  image,
  logo,
  icon,
  title,
  category,
  location,
  description,
  price,
  targetAmount,
  raisedAmount,
  investors,
  minInvestment,
  returns,
  duration,
  type = 'property'
}: PropertyCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Extract numeric values for modal
  const priceNumeric = price ? parseFloat(price.replace(/[^0-9.]/g, '')) : 
                       targetAmount ? parseFloat(targetAmount.replace(/[^0-9.]/g, '')) : 0;
  const minInvestmentNumeric = minInvestment ? parseFloat(minInvestment.replace(/[^0-9.]/g, '')) : 100000;

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  // Determine display price based on type
  const displayPrice = type === 'investment' ? minInvestment || 'PKR 100,000' :
                       type === 'crowdfunding' ? targetAmount || 'PKR 0' :
                       price || 'PKR 0';

  return (
    <>
      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={{
          id,
          title,
          price: displayPrice,
          priceNumeric,
          minInvestment: minInvestmentNumeric,
          type
        }}
      />
    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Property Image */}
      <div className="relative h-64 w-full bg-gradient-to-br from-blue-500 to-purple-600">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {logo && (
          <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md">
            <Image
              src={logo}
              alt="Logo"
              width={50}
              height={50}
              className="object-contain"
            />
          </div>
        )}
        {type === 'crowdfunding' && raisedAmount && targetAmount && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex justify-between text-white text-sm mb-2">
              <span>Raised: {raisedAmount}</span>
              <span>Target: {targetAmount}</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(parseFloat(raisedAmount.replace(/[^0-9.]/g, '')) / parseFloat(targetAmount.replace(/[^0-9.]/g, ''))) * 100}%`
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>

        {/* Category */}
        <p className="text-sm text-gray-600 mb-1">{category}</p>

        {/* Location */}
        <p className="text-sm text-gray-500 mb-4">{location}</p>

        {/* Description */}
        <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
          {description}
        </p>

        {/* Property Specific Info */}
        {type === 'property' && price && (
          <div className="mb-4">
            <p className="text-2xl font-bold text-blue-600">{price}</p>
          </div>
        )}

        {/* Crowdfunding Specific Info */}
        {type === 'crowdfunding' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {investors && (
              <div>
                <p className="text-xs text-gray-500">Investors</p>
                <p className="text-lg font-semibold text-gray-900">{investors}</p>
              </div>
            )}
            {minInvestment && (
              <div>
                <p className="text-xs text-gray-500">Min. Investment</p>
                <p className="text-lg font-semibold text-gray-900">{minInvestment}</p>
              </div>
            )}
          </div>
        )}

        {/* Investment Specific Info */}
        {type === 'investment' && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {returns && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Returns</p>
                <p className="text-lg font-semibold text-green-600">{returns}</p>
              </div>
            )}
            {duration && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-lg font-semibold text-gray-900">{duration}</p>
              </div>
            )}
            {minInvestment && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Min. Invest</p>
                <p className="text-lg font-semibold text-gray-900">{minInvestment}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {type === 'investment' ? (
          <div className="flex gap-2">
            <button 
              onClick={handleButtonClick}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Invest Now
            </button>
            <button 
              onClick={() => window.location.href = `/investments/${id}`}
              className="flex-1 bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              View Details
            </button>
          </div>
        ) : (
          <button 
            onClick={handleButtonClick}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            {type === 'property' ? 'Buy Now' : type === 'crowdfunding' ? 'Invest Now' : 'View Opportunity'}
          </button>
        )}
      </div>
    </div>
    </>
  );
}
