'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Stats {
  totalProperties: number;
  totalUsers: number;
  totalInvestments: number;
}

export default function AboutPage() {
  const [stats, setStats] = useState<Stats>({
    totalProperties: 0,
    totalUsers: 0,
    totalInvestments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-900 to-teal-900 py-20 shadow-xl">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">About PROPLEDGER</h1>
          <p className="text-lg text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed drop-shadow-md">
            CDA-Compliant Blockchain Real Estate Platform. Revolutionizing real estate investment through blockchain technology while ensuring full regulatory compliance.
          </p>
          <div className="inline-block px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-medium shadow-lg">
            <span className="mr-2">🌟</span>
            Trusted by 50,000+ Investors Worldwide
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-8">Our Mission</h2>
          <div className="max-w-4xl mx-auto text-center mb-16">
            <p className="text-lg text-gray-700 leading-relaxed mb-12">
              At PROPLEDGER, we believe that everyone should have access to premium real estate investment opportunities.
              By leveraging CDA-Compliant Blockchain Real Estate technology, we're democratizing property investment
              in Pakistan, making it accessible, transparent, and profitable for investors of all sizes while ensuring regulatory compliance.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-orange-500 mb-4">Accessibility</h3>
                <p className="text-gray-600">Making real estate investment accessible to everyone, regardless of their financial background.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Transparency</h3>
                <p className="text-gray-600">All transactions are recorded on the blockchain, ensuring complete transparency and trust.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all">
                <div className="text-5xl mb-4">📈</div>
                <h3 className="text-2xl font-bold text-purple-500 mb-4">Profitability</h3>
                <p className="text-gray-600">Delivering consistent returns through carefully curated real estate opportunities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Our Story</h2>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-blue-600 mb-6">From Vision to Reality</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Founded in March 2025 by a team of blockchain experts and real estate professionals, PROPLEDGER was born
                  from the vision of making property investment more inclusive and efficient in Pakistan, with a strong focus on CDA-Compliant Blockchain Real Estate and regulatory adherence.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Traditional real estate investment required significant capital and complex processes. We saw an
                  opportunity to leverage CDA-Compliant Blockchain Real Estate technology to break down these barriers and create a more
                  democratic, transparent, and legally compliant investment platform for Pakistan.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Today, we've facilitated over $500 million in property investments and continue to grow our
                  global community of investors who believe in the power of blockchain-enabled real estate.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                <h4 className="text-2xl font-bold text-gray-900 mb-8 text-center">Key Achievements</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-teal-600 mb-2">
                      {loading ? '...' : `PKR ${(stats.totalInvestments / 1000000).toFixed(1)}M+`}
                    </div>
                    <div className="text-gray-600">Total Investments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-teal-600 mb-2">
                      {loading ? '...' : `${stats.totalUsers.toLocaleString()}+`}
                    </div>
                    <div className="text-gray-600">Active Investors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-teal-600 mb-2">
                      {loading ? '...' : `${stats.totalProperties}+`}
                    </div>
                    <div className="text-gray-600">Properties Listed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-teal-600 mb-2">1</div>
                    <div className="text-gray-600">Country Served (Pakistan)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* CEO */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                👨‍💼
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">-</h3>
              <p className="text-teal-600 mb-4">CEO & Co-Founder</p>
              <p className="text-gray-600 text-sm">Former Goldman Sachs investment banker with 15+ years in real estate finance. Led the vision for blockchain-powered property investment.</p>
            </div>

            {/* CTO */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                👩‍💻
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">-</h3>
              <p className="text-teal-600 mb-4">CTO & Co-Founder</p>
              <p className="text-gray-600 text-sm">Blockchain architect and former Ethereum core developer. Expert in smart contracts and decentralized finance protocols.</p>
            </div>

            {/* Head of Real Estate */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                👨‍🏢
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">-</h3>
              <p className="text-teal-600 mb-4">Head of Real Estate</p>
              <p className="text-gray-600 text-sm">Real estate veteran with 20+ years experience in commercial and residential property development across global markets.</p>
            </div>

            {/* Head of Compliance */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                👩‍⚖️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">-</h3>
              <p className="text-teal-600 mb-4">Head of Compliance</p>
              <p className="text-gray-600 text-sm">Former SEC attorney specializing in securities law and blockchain regulations. Ensures all operations meet regulatory standards.</p>
            </div>

            {/* Head of Marketing */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                👨‍📢
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">-</h3>
              <p className="text-teal-600 mb-4">Head of Marketing</p>
              <p className="text-gray-600 text-sm">Growth marketing expert with experience at fintech unicorns. Passionate about blockchain education and community building.</p>
            </div>

            {/* Head of Operations */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                👩‍💼
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">-</h3>
              <p className="text-teal-600 mb-4">Head of Operations</p>
              <p className="text-gray-600 text-sm">Operations specialist with background in scaling tech platforms. Ensures smooth platform operations and user experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="text-5xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Integrity</h3>
              <p className="text-gray-600">Operating with honesty and transparency in all our dealings.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-600">Continuously pushing boundaries with cutting-edge technology.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community</h3>
              <p className="text-gray-600">Building a strong, supportive investor community.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-600">Striving for excellence in every aspect of our service.</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
