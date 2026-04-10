'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Property {
  id: string;
  image: string;
  icon?: string;
  title: string;
  category: string;
  location: string;
  description: string;
  fullDescription: string;
  price: string;
  priceNumeric: number;
  tokens: string;
  expectedROI: string;
  features: string[];
  amenities: string[];
  documents: { name: string; url: string; }[];
  gallery: string[];
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedOption, setSelectedOption] = useState<'full' | 'fractional'>('fractional');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'documents'>('overview');

  useEffect(() => {
    // Reset property state to force fresh load
    setProperty(null);
    
    // Sample property data - Replace with API call
    const properties: { [key: string]: Property } = {
      '1': {
        id: '1',
        image: '/images/property1.jpg',
        icon: '🏠',
        title: 'Property Share',
        category: 'Real Estate Ownership Made Easy',
        location: 'Arif Habib Dolmen REIT Management Limited',
        description: 'It is an innovative, bite-sized way to invest in high-value real estate. With Dolmen REIT, you can own a share of the most sought-after commercial properties without needing millions upfront.',
        fullDescription: 'Property Share by Dolmen REIT offers a revolutionary approach to real estate investment. This innovative platform allows investors to own fractional shares of premium commercial properties across Pakistan. Each property is carefully selected, verified by CDA, and managed by professional portfolio managers. Investors receive regular rental income distributions and benefit from property appreciation over time.',
        price: 'PKR 25,000,000',
        priceNumeric: 25000000,
        tokens: '25,000 PROP',
        expectedROI: '16% annually',
        features: [
          'CDA Approved Property',
          'Blockchain Secured Ownership',
          'Professional Management',
          'Regular Income Distribution',
          'Fractional Ownership Available',
          'Transparent Reporting'
        ],
        amenities: [
          '24/7 Security',
          'Prime Location',
          'Modern Infrastructure',
          'High Rental Demand',
          'Appreciation Potential',
          'Tax Benefits'
        ],
        documents: [
          { name: 'Property Title Deed', url: '#' },
          { name: 'CDA Approval Certificate', url: '#' },
          { name: 'Valuation Report', url: '#' },
          { name: 'Investment Prospectus', url: '#' }
        ],
        gallery: ['/images/property1.jpg', '/images/property2.jpg', '/images/property3.jpg']
      },
      '2': {
        id: '2',
        image: '/images/property2.jpg',
        icon: '🏨',
        title: 'Serene Heights Hotel & Resort',
        category: 'Hospitality',
        location: 'Nathia Gali, Khyber Pakhtunkhwa',
        description: 'Serene Heights in Nathia Gali is a luxury hotel and resort spanning 2.5 acres with 50 rooms, a spa, restaurant, and conference facilities.',
        fullDescription: 'Serene Heights is a premium hospitality investment opportunity located in the scenic Nathia Gali region. This luxury hotel and resort features 50 well-appointed rooms, a world-class spa, fine dining restaurant, and modern conference facilities. The property generates consistent revenue from tourism and corporate events throughout the year.',
        price: 'PKR 45,000,000',
        priceNumeric: 45000000,
        tokens: '45,000 PROP',
        expectedROI: '18% annually',
        features: [
          '50 Luxury Rooms',
          'Full-Service Spa',
          'Fine Dining Restaurant',
          'Conference Facilities',
          'Year-Round Revenue',
          'Professional Hotel Management'
        ],
        amenities: [
          'Mountain Views',
          'Swimming Pool',
          'Fitness Center',
          'Business Center',
          'Parking Facilities',
          'Event Spaces'
        ],
        documents: [
          { name: 'Hotel License', url: '#' },
          { name: 'Property Deed', url: '#' },
          { name: 'Revenue Report', url: '#' },
          { name: 'Management Agreement', url: '#' }
        ],
        gallery: ['/images/property2.jpg', '/images/property1.jpg', '/images/property3.jpg']
      },
      '7': {
        id: '7',
        image: '/images/beachfront.jpg',
        icon: '🏖️',
        title: 'Beachfront Cottage',
        category: 'Vacation Rental Investment',
        location: 'Coastal Area, Karachi',
        description: 'Charming 2-bedroom cottage with ocean views. Perfect vacation rental investment opportunity.',
        fullDescription: 'This charming beachfront cottage offers an excellent vacation rental investment opportunity. Located on the pristine coastline, this 2-bedroom property features stunning ocean views and direct beach access. The cottage is fully furnished and ready for rental operations, with a proven track record of high occupancy rates during peak seasons.',
        price: 'PKR 675,000',
        priceNumeric: 675000,
        tokens: '675 PROP',
        expectedROI: '16% annually',
        features: [
          '2 Bedrooms with Ocean Views',
          'Direct Beach Access',
          'Fully Furnished',
          'High Rental Demand',
          'Professional Property Management',
          'Proven Rental History'
        ],
        amenities: [
          'Ocean Front Location',
          'Private Beach Access',
          'Modern Kitchen',
          'Air Conditioning',
          'WiFi Included',
          'Parking Space'
        ],
        documents: [
          { name: 'Property Title Deed', url: '#' },
          { name: 'Rental History Report', url: '#' },
          { name: 'Valuation Certificate', url: '#' },
          { name: 'Management Agreement', url: '#' }
        ],
        gallery: ['/images/beachfront.jpg', '/images/property1.jpg', '/images/property2.jpg']
      },
      '8': {
        id: '8',
        image: '/images/victorian.jpg',
        icon: '🏛️',
        title: 'Historic Victorian Home',
        category: 'Heritage Property',
        location: 'Civil Lines, Karachi',
        description: 'Restored Victorian mansion with original features. Unique investment with heritage value.',
        fullDescription: 'This beautifully restored Victorian mansion represents a unique investment opportunity in heritage real estate. Built in the colonial era, this property has been meticulously restored while preserving its original architectural features. The home offers both historical significance and modern comfort, making it ideal for luxury rentals or boutique hospitality ventures.',
        price: 'PKR 1,250,000',
        priceNumeric: 1250000,
        tokens: '1,250 PROP',
        expectedROI: '11% annually',
        features: [
          'Historic Architecture',
          'Fully Restored Interiors',
          'Original Victorian Features',
          'Heritage Protection Status',
          'Prime Civil Lines Location',
          'Multiple Revenue Options'
        ],
        amenities: [
          'High Ceilings',
          'Original Woodwork',
          'Spacious Rooms',
          'Period Fixtures',
          'Modern Utilities',
          'Garden Area'
        ],
        documents: [
          { name: 'Heritage Certificate', url: '#' },
          { name: 'Restoration Report', url: '#' },
          { name: 'Property Deed', url: '#' },
          { name: 'Valuation Report', url: '#' }
        ],
        gallery: ['/images/victorian.jpg', '/images/property1.jpg', '/images/property2.jpg']
      },
      '9': {
        id: '9',
        image: '/images/smarthome.jpg',
        icon: '🏡',
        title: 'Smart Home - Tech District',
        category: 'Modern Smart Home',
        location: 'IT Park, Islamabad',
        description: 'Ultra-modern smart home with automated systems. Perfect for tech-savvy tenants.',
        fullDescription: 'Experience the future of real estate with this ultra-modern smart home in Islamabad\'s premier IT Park district. This property features cutting-edge home automation, energy-efficient systems, and contemporary design. Perfect for tech professionals and modern families, this home offers both comfort and innovation with strong rental demand from the tech sector.',
        price: 'PKR 925,000',
        priceNumeric: 925000,
        tokens: '925 PROP',
        expectedROI: '13% annually',
        features: [
          'Full Home Automation',
          'Smart Security System',
          'Energy Efficient Design',
          'High-Speed Fiber Internet',
          'Tech District Location',
          'Modern Architecture'
        ],
        amenities: [
          'Smart Lighting',
          'Climate Control',
          'Security Cameras',
          'Voice Control',
          'Solar Panels',
          'EV Charging'
        ],
        documents: [
          { name: 'Smart Home Specifications', url: '#' },
          { name: 'Property Title', url: '#' },
          { name: 'Energy Certificate', url: '#' },
          { name: 'Warranty Documents', url: '#' }
        ],
        gallery: ['/images/smarthome.jpg', '/images/property1.jpg', '/images/property2.jpg']
      }
    };

    const propertyData = properties[params.id as string];
    console.log('Loading property ID:', params.id);
    console.log('Property data:', propertyData);
    if (propertyData) {
      setProperty(propertyData);
    } else {
      console.error('Property not found for ID:', params.id);
    }
  }, [params.id]);

  const handleInvestment = () => {
    if (!investmentAmount) {
      alert('Please enter an investment amount');
      return;
    }
    // Redirect to payment/checkout page
    router.push(`/checkout?property=${params.id}&amount=${investmentAmount}&type=${selectedOption}`);
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div key={propertyId} className="min-h-screen bg-gray-50">
      {/* Hero Section with Property Image */}
      <div className="relative h-96 bg-gray-900">
        <Image
          src={property.image}
          alt={property.title}
          fill
          className="object-cover opacity-70"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8">
          <Link href="/properties" className="text-white hover:text-blue-400 mb-4 inline-block">
            ← Back to Properties
          </Link>
          <div className="flex items-start gap-4">
            {property.icon && (
              <div className="text-6xl bg-white p-4 rounded-lg">{property.icon}</div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{property.title}</h1>
              <p className="text-gray-300 text-lg">{property.category}</p>
              <p className="text-gray-400">{property.location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-4 font-semibold ${
                      activeTab === 'overview'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-4 font-semibold ${
                      activeTab === 'details'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`px-6 py-4 font-semibold ${
                      activeTab === 'documents'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Documents
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">About This Property</h2>
                    <p className="text-gray-700 leading-relaxed mb-6">{property.fullDescription}</p>

                    <h3 className="text-xl font-bold mb-3">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                      {property.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-xl font-bold mb-3">Amenities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {property.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-blue-600">•</span>
                          <span className="text-gray-700">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Property Details</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-semibold text-gray-700">Price:</span>
                        <span className="text-gray-900">{property.price}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-semibold text-gray-700">Tokens:</span>
                        <span className="text-gray-900">{property.tokens}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-semibold text-gray-700">Expected ROI:</span>
                        <span className="text-green-600 font-semibold">{property.expectedROI}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-semibold text-gray-700">Location:</span>
                        <span className="text-gray-900">{property.location}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-semibold text-gray-700">Category:</span>
                        <span className="text-gray-900">{property.category}</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="font-semibold text-gray-700">Status:</span>
                        <span className="text-green-600 font-semibold">Available</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Property Documents</h2>
                    <div className="space-y-3">
                      {property.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc.url}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📄</span>
                            <span className="font-semibold text-gray-700">{doc.name}</span>
                          </div>
                          <span className="text-blue-600">Download →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Investment Options */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h3 className="text-2xl font-bold mb-4">Investment Options</h3>

              {/* Price Display */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Price:</p>
                <p className="text-3xl font-bold text-blue-600">{property.price}</p>
                <p className="text-sm text-gray-600 mt-1">Tokens: {property.tokens}</p>
              </div>

              {/* ROI Display */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Expected ROI:</p>
                <p className="text-2xl font-bold text-green-600">{property.expectedROI}</p>
              </div>

              {/* Ownership Options */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Ownership Type:
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedOption('full')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedOption === 'full'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">Full Ownership</span>
                      <span className={`w-5 h-5 rounded-full border-2 ${
                        selectedOption === 'full'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedOption === 'full' && (
                          <span className="block w-full h-full rounded-full bg-white scale-50"></span>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Own 100% of the property</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">{property.price}</p>
                  </button>

                  <button
                    onClick={() => setSelectedOption('fractional')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedOption === 'fractional'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">Fractional Ownership</span>
                      <span className={`w-5 h-5 rounded-full border-2 ${
                        selectedOption === 'fractional'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedOption === 'fractional' && (
                          <span className="block w-full h-full rounded-full bg-white scale-50"></span>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Own a share of the property</p>
                    <p className="text-sm text-gray-500 mt-2">Min: PKR 100,000</p>
                  </button>
                </div>
              </div>

              {/* Investment Amount Input */}
              {selectedOption === 'fractional' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Investment Amount (PKR):
                  </label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="Enter amount (min 100,000)"
                    min="100000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {investmentAmount && (
                    <p className="text-sm text-gray-600 mt-2">
                      Tokens: {(parseInt(investmentAmount) / 1000).toLocaleString()} PROP
                    </p>
                  )}
                </div>
              )}

              {/* Buy Now Button */}
              <button
                onClick={handleInvestment}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl mb-3"
              >
                {selectedOption === 'full' ? 'Buy Now' : 'Invest Now'}
              </button>

              {/* Contact Agent */}
              <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                Contact Portfolio Manager
              </button>

              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>CDA Verified Property</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>Blockchain Secured</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>Professional Management</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>Transparent Reporting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
