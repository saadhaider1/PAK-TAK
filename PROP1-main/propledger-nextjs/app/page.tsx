'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import LoadingScreen from '@/components/LoadingScreen';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < 2 ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  };


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          const response = await fetch('/api/auth/session');
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        // Loop back to start after last slide
        if (prev === 2) {
          return 0;
        }
        return prev + 1;
      });
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Scroll-triggered animations for stats cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.getAttribute('data-delay') || '0';
            setTimeout(() => {
              entry.target.classList.add('animate-in-view');
              // Unobserve after animation triggers so it only happens once
              observer.unobserve(entry.target);
            }, parseInt(delay));
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of element is visible
        rootMargin: '0px 0px -100px 0px' // Start animation slightly before element is fully in view
      }
    );

    // Observe all stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card) => observer.observe(card));

    return () => {
      statCards.forEach((card) => observer.unobserve(card));
    };
  }, []);

  return (
    <>
      <LoadingScreen />
      <div className="min-h-screen bg-[#F0F4F8] font-sans">
        <Navbar />
        <Sidebar />

        {/* Hero Section */}
        <section className="pt-16 pb-24 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12">

              {/* Left Content */}
              <div className="lg:w-1/2 z-10">
                <div className="mb-2">
                  <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold mb-4">
                    PROPLEDGER: CDA-Compliant Real Estate Platform
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6">
                  Pakistan's First <span className="text-blue-600">Blockchain</span> Real Estate Platform
                </h1>

                <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed">
                  Invest in verified, CDA-compliant properties with as little as PKR 5,000. Secure ownership through blockchain technology.
                </p>

                {!user && (
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 gap-2"
                  >
                    Get Started <span className="text-xl">→</span>
                  </Link>
                )}
              </div>

              {/* Right Image */}
              <div className="lg:w-1/2 relative">
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white z-10">
                  <img
                    src="/images/login-bg.png"
                    alt="Modern Architecture"
                    className="w-full h-[600px] object-cover"
                  />

                  {/* Floating Badge */}
                  <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 animate-bounce-slow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        💎
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Market Status</p>
                        <p className="text-sm font-bold text-gray-900">Trending Up ↗</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute -z-10 top-20 right-[-50px] w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute -z-10 bottom-[-20px] left-20 w-80 h-80 bg-teal-200 rounded-full blur-3xl opacity-30"></div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">See how we can help</h2>
              <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full"></div>
            </div>

            {/* Carousel Container */}
            <div className="max-w-2xl mx-auto relative">
              {/* Carousel Track */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {/* Buy a home */}
                  <div className="w-full flex-shrink-0 px-4">
                    <div className="bg-white p-8 rounded-3xl text-center group hover:shadow-2xl transition-all duration-300 border border-gray-100">
                      <div className="w-20 h-20 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        🏠
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Buy a home</h3>
                      <p className="text-gray-500 mb-6 leading-relaxed">
                        With over 1 million+ homes for sale available on the website, we can match you with a house you will want to call home.
                      </p>
                      <Link href="/properties" className="text-blue-600 font-bold hover:text-blue-700 inline-flex items-center gap-2">
                        Find a home <span>→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Rent a home */}
                  <div className="w-full flex-shrink-0 px-4">
                    <div className="bg-white p-8 rounded-3xl text-center group hover:shadow-2xl transition-all duration-300 border border-gray-100">
                      <div className="w-20 h-20 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        🔑
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Rent a home</h3>
                      <p className="text-gray-500 mb-6 leading-relaxed">
                        With 35+ filters and custom keyword search, we can help you easily find a home or apartment for rent that you'll love.
                      </p>
                      <Link href="/properties" className="text-blue-600 font-bold hover:text-blue-700 inline-flex items-center gap-2">
                        Find rental <span>→</span>
                      </Link>
                    </div>
                  </div>

                  {/* See neighborhoods */}
                  <div className="w-full flex-shrink-0 px-4">
                    <div className="bg-white p-8 rounded-3xl text-center group hover:shadow-2xl transition-all duration-300 border border-gray-100">
                      <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        📍
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">See neighborhoods</h3>
                      <p className="text-gray-500 mb-6 leading-relaxed">
                        With more neighborhood insights than any other real estate website, we've captured the color and diversity of communities.
                      </p>
                      <Link href="/investments" className="text-blue-600 font-bold hover:text-blue-700 inline-flex items-center gap-2">
                        Learn more <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentSlide === 0}
              >
                <span className="text-2xl">←</span>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentSlide === 2}
              >
                <span className="text-2xl">→</span>
              </button>

              {/* Slide Indicators */}
              <div className="flex justify-center gap-2 mt-8">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${currentSlide === index
                      ? 'w-8 bg-blue-600'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Section - Promotional/Stats like original but styled nicer */}
        <section className="py-20 bg-[#F0F4F8] relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  How to find your <br />
                  <span className="text-blue-600">dream home</span> easily
                </h2>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  Our platform ensures true ownership through CDA-compliant blockchain technology.
                  We verify every property so you can invest with absolute confidence.
                </p>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold">1</div>
                    <div>
                      <h4 className="font-bold text-gray-900">Browse Properties</h4>
                      <p className="text-sm text-gray-500">Search through our verified listings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-xl font-bold">2</div>
                    <div>
                      <h4 className="font-bold text-gray-900">Connect Wallet</h4>
                      <p className="text-sm text-gray-500">Securely link your crypto wallet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xl font-bold">3</div>
                    <div>
                      <h4 className="font-bold text-gray-900">Own & Earn</h4>
                      <p className="text-sm text-gray-500">Receive tokens and start earning ROI</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="grid grid-cols-2 gap-4">
                  {/* Card 1: Property Value - Scroll Animated */}
                  <div className="stat-card bg-blue-600 p-6 rounded-3xl text-white transform translate-y-8 opacity-0" data-delay="0">
                    <div className="text-4xl font-bold mb-2">2.5B+</div>
                    <div className="text-blue-100">Property Value</div>
                  </div>

                  {/* Card 2: Active Investors - Scroll Animated */}
                  <div className="stat-card bg-teal-500 p-6 rounded-3xl text-white opacity-0" data-delay="200">
                    <div className="text-4xl font-bold mb-2">15k+</div>
                    <div className="text-teal-100">Active Investors</div>
                  </div>

                  {/* Card 3: CDA Compliant - Scroll Animated */}
                  <div className="stat-card bg-gray-900 p-6 rounded-3xl text-white transform translate-y-8 opacity-0" data-delay="400">
                    <div className="text-4xl font-bold mb-2">100%</div>
                    <div className="text-gray-400">CDA Compliant</div>
                  </div>

                  {/* Card 4: Average ROI - Scroll Animated */}
                  <div className="stat-card bg-white p-6 rounded-3xl shadow-xl border border-gray-100 opacity-0" data-delay="600">
                    <div className="text-4xl font-bold mb-2 text-blue-600">12.5%</div>
                    <div className="text-gray-500">Average ROI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
