'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function AgentLoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Use Next.js API route for authentication
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    loginType: 'agent',
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
                    // Redirect to agent dashboard
                    router.push(data.redirect || '/agent-dashboard');
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
                                Agent Login
                            </h1>
                            <p className="text-gray-600">Please enter your details</p>
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

                        {/* Sign Up Link */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-600 text-sm">
                                Are you new?{' '}
                                <Link href="/signup" className="text-gray-900 hover:text-gray-700 font-semibold transition-colors">
                                    Create an Account
                                </Link>
                            </p>
                        </div>

                        {/* Back to User Login */}
                        <div className="mt-4 text-center">
                            <p className="text-gray-500 text-xs">
                                Not an agent?{' '}
                                <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                                    User Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
