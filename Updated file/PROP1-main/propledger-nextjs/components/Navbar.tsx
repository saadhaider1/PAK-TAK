'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavbarProps {
  user?: {
    name: string;
    type: string;
  } | null;
}

export default function Navbar({ user: propUser }: NavbarProps) {
  const pathname = usePathname();
  const [tokenCount, setTokenCount] = useState(0);
  const [tokenValue, setTokenValue] = useState(0);
  const [user, setUser] = useState(propUser);

  useEffect(() => {
    // Check localStorage for user if not passed as prop
    if (!propUser) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser({
          name: userData.full_name || userData.name,
          type: userData.user_type || userData.type
        });
        // Load token balance for authenticated user
        loadTokenBalance();
      }
    } else {
      setUser(propUser);
      loadTokenBalance();
    }
  }, [propUser]);

  const loadTokenBalance = async () => {
    try {
      const response = await fetch('/api/tokens/balance');
      const data = await response.json();

      if (data.success) {
        setTokenCount(data.tokens.balance);
        setTokenValue(data.tokens.pkrValue);
      }
    } catch (error) {
      console.error('Error loading token balance:', error);
      // Set default values if API fails
      setTokenCount(0);
      setTokenValue(0);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-teal-900 backdrop-blur-md border-b border-teal-700/30 sticky top-0 z-50 shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-md">
                ⛓️
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent tracking-tight">PROPLEDGER</span>
            </Link>

            {/* Token Bar - Only show when logged in and not an agent */}
            {user && user.type !== 'agent' && (
              <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg">
                <span className="text-white font-medium text-sm">{tokenCount} Tokens</span>
                <span className="text-white/50">|</span>
                <span className="text-teal-300 font-medium text-sm">₨ {tokenValue.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <ul className="hidden lg:flex items-center gap-8">
            <li>
              <Link
                href="/"
                className={`transition-colors text-sm font-medium px-4 py-2 rounded-lg ${isActive('/') ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/investments"
                className={`transition-colors text-sm font-medium px-4 py-2 rounded-lg ${isActive('/investments') ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Investments
              </Link>
            </li>
            <li>
              <Link
                href="/properties"
                className={`transition-colors text-sm font-medium px-4 py-2 rounded-lg ${isActive('/properties') ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Properties
              </Link>
            </li>
            <li>
              <Link
                href="/crowdfunding"
                className={`transition-colors text-sm font-medium px-4 py-2 rounded-lg ${isActive('/crowdfunding') ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Crowdfunding
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={`transition-colors text-sm font-medium px-4 py-2 rounded-lg ${isActive('/about') ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/support"
                className={`transition-colors text-sm font-medium px-4 py-2 rounded-lg ${isActive('/support') ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                Support
              </Link>
            </li>
          </ul>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>

                <Link
                  href={user.type === 'agent' ? '/agent-dashboard' : '/dashboard'}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all text-sm font-medium border border-white/20 shadow-lg"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    // Clear localStorage
                    localStorage.removeItem('user');
                    // Call PHP logout
                    try {
                      await fetch('http://localhost/PROPLEDGER/auth/logout_handler.php', {
                        method: 'POST',
                        credentials: 'include'
                      });
                    } catch (err) {
                      console.error('Logout error:', err);
                    }
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-lg hover:bg-white/20 hover:text-white transition-all text-sm font-medium border border-white/20 shadow-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all text-sm font-medium border border-white/20 shadow-lg"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all text-sm font-semibold shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
