import Link from 'next/link';
import Navbar from '@/components/Navbar';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <div className="min-h-screen bg-white">
        <Navbar />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-gray-900 to-gray-800 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-5xl mx-auto">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                PROPLEDGER
              </h1>
              <p className="text-2xl md:text-3xl text-blue-400 mb-6 font-medium">
                Pakistan's First CDA-Compliant Blockchain Real Estate Investment Platform
              </p>
              <p className="text-lg text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
                Revolutionizing property investment with blockchain technology, smart contracts, and full CDA compliance. 
                Invest in tokenized properties, earn transparent ROI, and participate in Pakistan's digital real estate future.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:bg-blue-500/20 transition-all">
                  <div className="text-4xl font-bold text-blue-400 mb-2">₨2.5B+</div>
                  <div className="text-gray-400 text-sm">Property Value</div>
                </div>
                <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:bg-blue-500/20 transition-all">
                  <div className="text-4xl font-bold text-blue-400 mb-2">1,200+</div>
                  <div className="text-gray-400 text-sm">CDA Approved Properties</div>
                </div>
                <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:bg-blue-500/20 transition-all">
                  <div className="text-4xl font-bold text-blue-400 mb-2">15,000+</div>
                  <div className="text-gray-400 text-sm">Active Investors</div>
                </div>
                <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:bg-blue-500/20 transition-all">
                  <div className="text-4xl font-bold text-blue-400 mb-2">12.5%</div>
                  <div className="text-gray-400 text-sm">Average ROI</div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap justify-center gap-4 mb-10">
                <div className="px-6 py-3 bg-green-600 rounded-lg font-semibold text-white">
                  <span className="mr-2">🏢</span>
                  CDA Certified Platform
                </div>
                <div className="px-6 py-3 bg-indigo-600 rounded-lg font-semibold text-white">
                  <span className="mr-2">🔗</span>
                  Blockchain Secured
                </div>
                <div className="px-6 py-3 bg-amber-500 rounded-lg font-semibold text-white">
                  <span className="mr-2">🛡️</span>
                  Smart Contract Protected
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all text-lg"
                >
                  📊 My Dashboard
                </Link>
                <Link
                  href="/properties"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-lg"
                >
                  🏠 Browse CDA Properties
                </Link>
                <Link
                  href="/investments"
                  className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all text-lg"
                >
                  💰 Start Investing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose PROPLEDGER Section */}
        <section className="py-20 bg-gradient-to-b from-gray-800 to-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-white mb-16">Why Choose PROPLEDGER?</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/50 transition-all transform hover:-translate-y-2 shadow-xl">
                <div className="text-5xl mb-6">🔒</div>
                <h3 className="text-2xl font-bold text-blue-400 mb-4">Blockchain Security</h3>
                <p className="text-gray-300 leading-relaxed">
                  All transactions secured with blockchain technology and smart contracts. Your investments are protected by cryptographic security.
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-green-500/30 rounded-2xl p-8 hover:border-green-500/50 transition-all transform hover:-translate-y-2 shadow-xl">
                <div className="text-5xl mb-6">💰</div>
                <h3 className="text-2xl font-bold text-green-400 mb-4">Token-Based Investment</h3>
                <p className="text-gray-300 leading-relaxed">
                  Invest in properties using PROP tokens (1 PROP = ₨1,000). Fractional ownership makes real estate accessible to everyone.
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/30 rounded-2xl p-8 hover:border-purple-500/50 transition-all transform hover:-translate-y-2 shadow-xl">
                <div className="text-5xl mb-6">✅</div>
                <h3 className="text-2xl font-bold text-purple-400 mb-4">CDA Compliant</h3>
                <p className="text-gray-300 leading-relaxed">
                  All properties verified and compliant with Capital Development Authority regulations. Invest with confidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-800">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Investment Journey?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Join thousands of investors who are building wealth through blockchain-secured real estate investments.
            </p>
            <Link
              href="/signup"
              className="inline-block px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-xl shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105"
            >
              Create Free Account
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
