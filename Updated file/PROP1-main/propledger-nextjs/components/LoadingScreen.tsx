'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 animate-fade-out">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxNGI4YTYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTRjMy4zMSAwIDYtMi42OSA2LTZzLTIuNjktNi02LTYtNiAyLjY5LTYgNiAyLjY5IDYgNiA2em0wLTEwYzIuMjEgMCA0IDEuNzkgNCA0cy0xLjc5IDQtNCA0LTQtMS43OS00LTQgMS43OS00IDQtNHpNNiAzNGMzLjMxIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6bTAtMTBjMi4yMSAwIDQgMS43OSA0IDRzLTEuNzkgNC00IDQtNC0xLjc5LTQtNCAxLjc5LTQgNC00eiIvPjwvZz48L2c+PC9zdmc+')] animate-pulse"></div>
      </div>

      <div className="text-center relative z-10">
        {/* Logo with Gradient Background */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-teal-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
            <span className="text-4xl">⛓️</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-400 via-blue-400 to-teal-300 bg-clip-text text-transparent tracking-wider drop-shadow-2xl mb-2">
            PROPLEDGER
          </h1>
          <p className="text-teal-300/70 text-sm tracking-widest">CDA-COMPLIANT BLOCKCHAIN REAL ESTATE PLATFORM</p>
        </div>

        {/* Modern Spinner */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
          {/* Spinning gradient ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-teal-400 border-r-blue-400 rounded-full animate-spin"></div>
          {/* Middle ring */}
          <div className="absolute inset-2 border-4 border-transparent border-t-teal-300/80 rounded-full animate-spin-slow"></div>
          {/* Inner ring */}
          <div className="absolute inset-4 border-4 border-transparent border-t-blue-300/60 rounded-full animate-spin-slower"></div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Loading Text with Gradient */}
        <div className="space-y-3">
          <p className="text-lg font-medium bg-gradient-to-r from-teal-300 to-blue-300 bg-clip-text text-transparent">
            Initializing Blockchain Network
          </p>
          <div className="flex justify-center gap-2">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>

        {/* Floating Particles with Gradient Colors */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-3 h-3 rounded-full animate-float ${i % 2 === 0 ? 'bg-teal-400/20' : 'bg-blue-400/20'
                }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Bottom Glow Effect */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-t from-teal-500/20 to-transparent blur-3xl"></div>
      </div>
    </div>
  );
}
