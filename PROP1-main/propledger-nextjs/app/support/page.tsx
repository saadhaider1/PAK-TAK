'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SupportPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-900 to-teal-900 py-20 shadow-xl">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">Support Center</h1>
          <p className="text-lg text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed drop-shadow-md">
            Get help with your PROPLEDGER account, investments, and blockchain transactions. CDA-Compliant Blockchain Real Estate Platform. Our support team is here to assist you 24/7.
          </p>
          <div className="inline-block px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-medium shadow-lg">
            <span className="mr-2">🎧</span>
            24/7 Expert Support Available
          </div>
        </div>
      </section>

      {/* Quick Help Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">How Can We Help You?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Account Help */}
            <div
              onClick={() => toggleSection('account')}
              className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">👤</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Account & Profile</h3>
              <p className="text-gray-600 mb-6">Issues with login, account settings, profile updates, and wallet connections.</p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                Get Help
              </button>
            </div>

            {/* Investment Help */}
            <div
              onClick={() => toggleSection('investment')}
              className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-2xl font-bold text-white mb-4">Investments & Returns</h3>
              <p className="text-gray-400 mb-6">Questions about investment plans, ROI calculations, and dividend distributions.</p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                Get Help
              </button>
            </div>

            {/* Property Help */}
            <div
              onClick={() => toggleSection('property')}
              className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-2xl font-bold text-white mb-4">Property Purchases</h3>
              <p className="text-gray-400 mb-6">Help with buying properties, fractional shares, and ownership transfers.</p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                Get Help
              </button>
            </div>

            {/* Blockchain Help */}
            <div
              onClick={() => toggleSection('blockchain')}
              className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">⛓️</div>
              <h3 className="text-2xl font-bold text-white mb-4">Blockchain & Tokens</h3>
              <p className="text-gray-400 mb-6">Understanding PROP tokens, smart contracts, and blockchain transactions.</p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                Get Help
              </button>
            </div>

            {/* Technical Help */}
            <div
              onClick={() => toggleSection('technical')}
              className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">🔧</div>
              <h3 className="text-2xl font-bold text-white mb-4">Technical Issues</h3>
              <p className="text-gray-400 mb-6">Website problems, mobile app issues, and technical troubleshooting.</p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                Get Help
              </button>
            </div>

            {/* Security Help */}
            <div
              onClick={() => toggleSection('security')}
              className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-2xl font-bold text-white mb-4">Security & Safety</h3>
              <p className="text-gray-400 mb-6">Account security, two-factor authentication, and fraud prevention.</p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                Get Help
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Frequently Asked Questions</h2>

          {/* Account FAQ */}
          {activeSection === 'account' && (
            <div className="max-w-4xl mx-auto mb-12 animate-fadeIn">
              <h3 className="text-3xl font-bold text-teal-600 mb-8">Account & Profile</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">How do I reset my password?</h4>
                  <p className="text-gray-400">Click "Forgot Password" on the login page, enter your email, and follow the reset instructions sent to your inbox.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Can I connect multiple wallets?</h4>
                  <p className="text-gray-400">Yes, you can connect multiple cryptocurrency wallets to your account for flexibility in transactions.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">How do I update my profile information?</h4>
                  <p className="text-gray-400">Log in to your account, go to Settings → Profile, and update your personal information and preferences.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Is my account information secure?</h4>
                  <p className="text-gray-400">Yes, we use bank-level encryption and blockchain security to protect all user data and transactions.</p>
                </div>
              </div>
            </div>
          )}

          {/* Investment FAQ */}
          {activeSection === 'investment' && (
            <div className="max-w-4xl mx-auto mb-12 animate-fadeIn">
              <h3 className="text-3xl font-bold text-teal-600 mb-8">Investments & Returns</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">What is the minimum investment amount?</h4>
                  <p className="text-gray-400">Minimum investment starts from PKR 75,000 depending on the property or investment opportunity.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">How are returns calculated?</h4>
                  <p className="text-gray-400">Returns are calculated based on property appreciation and rental income, distributed according to your ownership percentage.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">When do I receive dividend payments?</h4>
                  <p className="text-gray-400">Dividend frequency depends on your investment plan: monthly, quarterly, or annually as specified in the investment terms.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Can I withdraw my investment early?</h4>
                  <p className="text-gray-400">Early withdrawal terms vary by investment. Some have lock-up periods while others allow flexible withdrawals with potential fees.</p>
                </div>
              </div>
            </div>
          )}

          {/* Property FAQ */}
          {activeSection === 'property' && (
            <div className="max-w-4xl mx-auto mb-12 animate-fadeIn">
              <h3 className="text-3xl font-bold text-teal-600 mb-8">Property Purchases</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">What are fractional shares?</h4>
                  <p className="text-gray-400">Fractional shares allow you to own a percentage of a property by purchasing tokens representing your ownership stake.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">How does rent-to-own work?</h4>
                  <p className="text-gray-400">Make a down payment and monthly payments over a set term. At the end, you have the option to own the property outright.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Are properties physically inspected?</h4>
                  <p className="text-gray-400">Yes, all properties undergo professional inspections and due diligence before being listed on our platform.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Can I visit properties before buying?</h4>
                  <p className="text-gray-400">Virtual tours are available for all properties. Physical visits can be arranged for full ownership purchases.</p>
                </div>
              </div>
            </div>
          )}

          {/* Blockchain FAQ */}
          {activeSection === 'blockchain' && (
            <div className="max-w-4xl mx-auto mb-12 animate-fadeIn">
              <h3 className="text-3xl font-bold text-teal-600 mb-8">Blockchain & Tokens</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">What are PROP tokens?</h4>
                  <p className="text-gray-400">PROP tokens are blockchain tokens that represent your ownership in properties and investments on the PROPLEDGER platform. 1 PROP = PKR 1,000.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">How do smart contracts work?</h4>
                  <p className="text-gray-400">Smart contracts automatically execute transactions and distribute dividends based on predefined rules, ensuring transparency and reliability.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Can I trade PROP tokens?</h4>
                  <p className="text-gray-400">PROP tokens can be traded on supported exchanges and through our platform's internal marketplace.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">What blockchain does PROPLEDGER use?</h4>
                  <p className="text-gray-400">We operate on Ethereum blockchain with plans to expand to other Layer 1 and Layer 2 solutions for better scalability.</p>
                </div>
              </div>
            </div>
          )}

          {/* Technical FAQ */}
          {activeSection === 'technical' && (
            <div className="max-w-4xl mx-auto mb-12 animate-fadeIn">
              <h3 className="text-3xl font-bold text-teal-600 mb-8">Technical Issues</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Why can't I log in?</h4>
                  <p className="text-gray-400">Clear your browser cache, check your internet connection, and ensure you're using the correct credentials. Try password reset if needed.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Is there a mobile app?</h4>
                  <p className="text-gray-400">Our mobile app is currently in development. For now, our website is fully responsive and works great on mobile browsers.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">What browsers are supported?</h4>
                  <p className="text-gray-400">We support the latest versions of Chrome, Firefox, Safari, and Edge. For best experience, keep your browser updated.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">How do I report a bug?</h4>
                  <p className="text-gray-400">Contact our support team at support@propledger.com with details about the issue, including screenshots if possible.</p>
                </div>
              </div>
            </div>
          )}

          {/* Security FAQ */}
          {activeSection === 'security' && (
            <div className="max-w-4xl mx-auto mb-12 animate-fadeIn">
              <h3 className="text-3xl font-bold text-teal-600 mb-8">Security & Safety</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">How do I enable two-factor authentication?</h4>
                  <p className="text-gray-400">Go to Settings → Security → Enable 2FA. Follow the instructions to link your authenticator app for added security.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">What if I suspect fraud?</h4>
                  <p className="text-gray-400">Immediately contact our security team at security@propledger.com and change your password. We'll investigate and secure your account.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">How is my data protected?</h4>
                  <p className="text-gray-400">We use bank-level 256-bit encryption, secure blockchain technology, and regular security audits to protect your data.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Can I recover a hacked account?</h4>
                  <p className="text-gray-400">Contact support immediately. We'll freeze the account, investigate the breach, and help you recover access securely.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Still Need Help?</h2>
            <p className="text-xl text-gray-700 mb-8">
              Our support team is available 24/7 to assist you with any questions or concerns.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
                <p className="text-teal-600">support@propledger.com</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-gray-600">Available 24/7</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                <div className="text-4xl mb-4">📞</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Phone Support</h3>
                <p className="text-teal-600">+92 300 1234567</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
