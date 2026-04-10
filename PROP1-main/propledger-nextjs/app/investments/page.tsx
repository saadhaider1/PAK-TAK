'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';

interface Property {
  id: number;
  title: string;
  description?: string;
  location: string;
  price: number;
  token_price: number;
  total_tokens: number;
  available_tokens: number;
  property_type: string;
  image_url?: string;
}

export default function InvestmentsPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch properties (investment opportunities) from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/properties');
        const data = await response.json();

        if (data.success) {
          // Filter for commercial and mixed types (investment opportunities)
          const investmentProperties = data.properties.filter(
            (prop: Property) => prop.property_type === 'commercial' || prop.property_type === 'mixed'
          );
          setProperties(investmentProperties);
        } else {
          setError(data.message || 'Failed to load investment opportunities');
        }
      } catch (err) {
        console.error('Error fetching investment opportunities:', err);
        setError('Failed to load investment opportunities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Transform properties to investment format
  const investments = properties.map(prop => {
    return {
      id: prop.id.toString(),
      image: prop.image_url || '/images/property-placeholder.jpg',
      title: prop.title,
      category: prop.property_type,
      location: prop.location,
      description: prop.description || '',
      returns: (prop as any).returns || '12-15%',
      duration: (prop as any).duration || '3-5 Years',
      minInvestment: `PKR ${((prop as any).min_investment || prop.token_price).toLocaleString()}`,
      type: 'investment' as const,
      fullDescription: prop.description || ''
    };
  });

  const filteredInvestments = investments.filter(investment => {
    const matchesSearch = investment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investment.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'short' && (investment.duration.includes('2') || investment.duration.includes('3'))) ||
      (filter === 'medium' && (investment.duration.includes('4') || investment.duration.includes('5'))) ||
      (filter === 'long' && (investment.duration.includes('6') || investment.duration.includes('7')));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans">
      <Navbar />
      <Sidebar />

      {/* Hero Section - Clean Light Style */}
      <div className="bg-white border-b border-gray-100 pt-12 pb-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block p-3 rounded-full bg-blue-50 mb-6">
            <span className="text-3xl">📈</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Investment <span className="text-blue-600">Opportunities</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Secure your financial future with verified real estate investments offering solid returns and security.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-12 transform -translate-y-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Opportunities</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Investment Duration</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">⏱️</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 appearance-none transition-all cursor-pointer"
                >
                  <option value="all">All Durations</option>
                  <option value="short">Short Term (2-3 Years)</option>
                  <option value="medium">Medium Term (4-5 Years)</option>
                  <option value="long">Long Term (6+ Years)</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Clean Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 -mt-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">{investments.length}</p>
            <p className="text-gray-500 text-sm font-medium">Opportunities</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-600 mb-1">15.8%</p>
            <p className="text-gray-500 text-sm font-medium">Avg. Annual Returns</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600 mb-1">100K</p>
            <p className="text-gray-500 text-sm font-medium">Min. Entry (PKR)</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">5k+</p>
            <p className="text-gray-500 text-sm font-medium">Active Investors</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading investment opportunities...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Opportunities</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Investments Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredInvestments.map((investment) => (
                <PropertyCard key={investment.id} {...investment} />
              ))}
            </div>

            {/* No Results */}
            {filteredInvestments.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-6xl mb-4 text-gray-200">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No investments found</h3>
                <p className="text-gray-500">Try adjusting your filters to find suitable opportunities.</p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
