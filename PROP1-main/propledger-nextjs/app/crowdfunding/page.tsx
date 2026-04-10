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

export default function CrowdfundingPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch crowdfunding properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/properties');
        const data = await response.json();

        if (data.success) {
          // Filter for land type (crowdfunding properties)
          const crowdfundingProperties = data.properties.filter(
            (prop: Property) => prop.property_type === 'land' || prop.property_type === 'mixed'
          );
          setProperties(crowdfundingProperties);
        } else {
          setError(data.message || 'Failed to load campaigns');
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError('Failed to load campaigns. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Transform properties to campaign format
  const campaigns = properties.map(prop => {
    const raisedPercentage = ((prop.total_tokens - prop.available_tokens) / prop.total_tokens) * 100;

    return {
      id: prop.id.toString(),
      image: prop.image_url || '/images/property-placeholder.jpg',
      title: prop.title,
      category: prop.property_type === 'land' ? 'Land Development' : 'Mixed Development',
      location: prop.location,
      description: prop.description || '',
      targetAmount: `PKR ${prop.price.toLocaleString()}`,
      raisedAmount: `PKR ${Math.round(prop.price * raisedPercentage / 100).toLocaleString()}`,
      investors: Math.floor(((prop.total_tokens - prop.available_tokens) / 10) + 50),
      minInvestment: `PKR ${prop.token_price.toLocaleString()}`,
      type: 'crowdfunding' as const
    };
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'active' && parseFloat(campaign.raisedAmount.replace(/[^0-9.]/g, '')) < parseFloat(campaign.targetAmount.replace(/[^0-9.]/g, ''))) ||
      (filter === 'completed' && parseFloat(campaign.raisedAmount.replace(/[^0-9.]/g, '')) >= parseFloat(campaign.targetAmount.replace(/[^0-9.]/g, '')));
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
            <span className="text-3xl">🧩</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Crowdfunding <span className="text-blue-600">Campaigns</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Join community-funded real estate projects and own a share of premium properties with smaller investments.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-12 transform -translate-y-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Campaigns</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Status</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📊</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 appearance-none transition-all cursor-pointer"
                >
                  <option value="all">All Campaigns</option>
                  <option value="active">Active Campaigns</option>
                  <option value="completed">Fully Funded</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Clean Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 -mt-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">{campaigns.length}</p>
            <p className="text-gray-500 text-sm font-medium">Active Campaigns</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-600 mb-1">1.2B+</p>
            <p className="text-gray-500 text-sm font-medium">Total Funded (PKR)</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">3.5k+</p>
            <p className="text-gray-500 text-sm font-medium">Active Investors</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600 mb-1">50K</p>
            <p className="text-gray-500 text-sm font-medium">Min. Contribution</p>
          </div>
        </div>

        {/* How It Works - Clean Style */}
        <div className="bg-white rounded-3xl p-8 mb-12 border border-gray-100 shadow-sm">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How Crowdfunding Works</h2>
            <p className="text-gray-500">Simple steps to start your real estate journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Process Line */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-gray-100 -z-10"></div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-xl font-bold text-blue-600 mx-auto mb-4 border-4 border-white shadow-sm group-hover:scale-110 transition-transform">1</div>
              <h3 className="font-bold text-gray-900 mb-1">Browse Projects</h3>
              <p className="text-sm text-gray-500">Explore verified campaigns</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-xl font-bold text-blue-600 mx-auto mb-4 border-4 border-white shadow-sm group-hover:scale-110 transition-transform">2</div>
              <h3 className="font-bold text-gray-900 mb-1">Choose Investment</h3>
              <p className="text-sm text-gray-500">Select amount & review</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-xl font-bold text-blue-600 mx-auto mb-4 border-4 border-white shadow-sm group-hover:scale-110 transition-transform">3</div>
              <h3 className="font-bold text-gray-900 mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-500">Blockchain transaction</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-xl font-bold text-green-600 mx-auto mb-4 border-4 border-white shadow-sm group-hover:scale-110 transition-transform">4</div>
              <h3 className="font-bold text-gray-900 mb-1">Earn Returns</h3>
              <p className="text-sm text-gray-500">Receive regular profits</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading campaigns...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Campaigns</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Campaigns Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCampaigns.map((campaign) => (
                <PropertyCard key={campaign.id} {...campaign} />
              ))}
            </div>

            {/* No Results */}
            {filteredCampaigns.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-6xl mb-4 text-gray-200">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No campaigns found</h3>
                <p className="text-gray-500">Try changing your filters to see more results.</p>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
