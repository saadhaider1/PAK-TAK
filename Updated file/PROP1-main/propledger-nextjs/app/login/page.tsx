'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'user' | 'agent' | 'admin'>('user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to connect with Google. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use different API route for admin login
      const endpoint = loginType === 'admin' ? '/api/auth/admin-login' : '/api/auth/login';

      // Use Next.js API route for authentication
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          loginType: loginType,
          remember: formData.remember,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage for Next.js app
        localStorage.setItem('user', JSON.stringify(data.user));

        // Show success message
        setSuccess(true);

        // Smooth transition before redirect
        setTimeout(() => {
          // Redirect based on backend response
          if (data.redirect) {
            router.push(data.redirect);
          } else {
            // Fallback
            if (loginType === 'admin') {
              localStorage.setItem('admin_token', 'logged_in');
              router.push('/admin/dashboard');
            } else if (loginType === 'agent') {
              router.push('/agent-dashboard');
            } else {
              router.push('/dashboard');
            }
          }
        }, 1000);
      } else {
        setError(data.message || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/login-bg.png)',
          filter: 'brightness(0.7)',
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50" />

      {/* Navbar */}
      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Glassmorphic Form Container */}
          <div className="glass-card-light rounded-3xl p-8 shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {loginType === 'user' ? 'User Login' : loginType === 'agent' ? 'Agent Login' : 'Admin Login'}
              </h1>
              <p className="text-gray-600">Please enter your details</p>
            </div>

            {/* Login Type Selection */}
            <div className="mb-6">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLoginType('user')}
                  className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all text-sm ${loginType === 'user'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  👤 User
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('agent')}
                  className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all text-sm ${loginType === 'agent'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  🏢 Agent
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('admin')}
                  className={`flex-1 py-3 px-3 rounded-lg font-medium transition-all text-sm ${loginType === 'admin'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  🛡️ Admin
                </button>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fadeIn">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-700 font-medium">Login Successful!</p>
                  <p className="text-green-600 text-sm">Redirecting to your dashboard...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-gray-700 mb-2 font-medium text-sm">
                  Username
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 glass-input rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                  placeholder="Jonathan_Reichert07"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-gray-700 mb-2 font-medium text-sm">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 glass-input rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                  placeholder="••••••••••"
                />
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Signing in...' : success ? 'Success!' : 'Sign in'}
              </button>
            </form>

            {/* OAuth Login - User Only */}
            {loginType === 'user' && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || success}
                  className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            )}

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Are you new?{' '}
                <Link href="/signup" className="text-gray-900 hover:text-gray-700 font-semibold transition-colors">
                  Create an Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
