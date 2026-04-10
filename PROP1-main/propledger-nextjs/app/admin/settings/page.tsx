'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminSettings() {
    const { theme, toggleTheme } = useTheme();
    const [activeSection, setActiveSection] = useState<'general' | 'appearance' | 'notifications'>('appearance');

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <AdminSidebar />

            <div className="flex-1 ml-64">
                <AdminHeader title="Settings" />

                <main className="p-8">
                    <div className="max-w-5xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your admin dashboard preferences</p>
                        </div>

                        {/* Settings Navigation */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                            <div className="flex border-b border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setActiveSection('general')}
                                    className={`px-6 py-4 font-medium text-sm transition-colors ${activeSection === 'general'
                                        ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    General
                                </button>
                                <button
                                    onClick={() => setActiveSection('appearance')}
                                    className={`px-6 py-4 font-medium text-sm transition-colors ${activeSection === 'appearance'
                                        ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Appearance
                                </button>
                                <button
                                    onClick={() => setActiveSection('notifications')}
                                    className={`px-6 py-4 font-medium text-sm transition-colors ${activeSection === 'notifications'
                                        ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Notifications
                                </button>
                            </div>

                            {/* Settings Content */}
                            <div className="p-6">
                                {activeSection === 'appearance' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance Settings</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                                Customize how your admin dashboard looks
                                            </p>
                                        </div>

                                        {/* Theme Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                                    {theme === 'dark' ? (
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Dark Theme</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {theme === 'dark' ? 'Dark mode is enabled' : 'Switch to dark mode'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleTheme}
                                                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${theme === 'dark' ? 'bg-emerald-600' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Theme Preview */}
                                        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Preview</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <div className="w-8 h-8 bg-emerald-500 rounded-lg mb-3"></div>
                                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                                </div>
                                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <div className="w-8 h-8 bg-blue-500 rounded-lg mb-3"></div>
                                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'general' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Configure your admin dashboard preferences
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'notifications' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Settings</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Manage how you receive notifications
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
