'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Email, 2: PIN, 3: New Password
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleRequestPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.message || data.error || 'Something went wrong');

            setMessage(data.message);
            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, pin }),
            });
            const data = await res.json();

            if (!data.valid) throw new Error(data.message || 'Invalid PIN');

            setStep(3);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, pin, newPassword }),
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.message || data.error || 'Failed to reset password');

            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
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
                                {step === 1 && 'Forgot Password'}
                                {step === 2 && 'Verify PIN'}
                                {step === 3 && 'Reset Password'}
                            </h1>
                            <p className="text-gray-600 text-sm">
                                {step === 1 && 'Enter your email to receive a verification PIN'}
                                {step === 2 && `Enter the 6-digit PIN sent to ${email}`}
                                {step === 3 && 'Create a new password for your account'}
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {message && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                                {message}
                            </div>
                        )}

                        {/* Step 1: Email */}
                        {step === 1 && (
                            <form className="space-y-5" onSubmit={handleRequestPin}>
                                <div>
                                    <label htmlFor="email" className="block text-gray-700 mb-2 font-medium text-sm">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 glass-input rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {loading ? 'Sending...' : 'Send PIN'}
                                </button>
                                <div className="text-center">
                                    <Link href="/login" className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors">
                                        Back to Login
                                    </Link>
                                </div>
                            </form>
                        )}

                        {/* Step 2: PIN Verification */}
                        {step === 2 && (
                            <form className="space-y-5" onSubmit={handleVerifyPin}>
                                <div>
                                    <label htmlFor="pin" className="block text-gray-700 mb-2 font-medium text-sm">
                                        Enter PIN
                                    </label>
                                    <input
                                        id="pin"
                                        name="pin"
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="w-full px-4 py-3 glass-input rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-center tracking-widest text-2xl"
                                        placeholder="000000"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {loading ? 'Verifying...' : 'Verify PIN'}
                                </button>
                            </form>
                        )}

                        {/* Step 3: New Password */}
                        {step === 3 && (
                            <form className="space-y-5" onSubmit={handleResetPassword}>
                                <div>
                                    <label htmlFor="new-password" className="block text-gray-700 mb-2 font-medium text-sm">
                                        New Password
                                    </label>
                                    <input
                                        id="new-password"
                                        name="new-password"
                                        type="password"
                                        required
                                        className="w-full px-4 py-3 glass-input rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirm-password" className="block text-gray-700 mb-2 font-medium text-sm">
                                        Confirm Password
                                    </label>
                                    <input
                                        id="confirm-password"
                                        name="confirm-password"
                                        type="password"
                                        required
                                        className="w-full px-4 py-3 glass-input rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
