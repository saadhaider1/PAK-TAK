'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';

export default function Sidebar() {
    const { walletAddress, connectWallet, disconnectWallet } = useWallet();

    // No local state needed anymore!
    const account = walletAddress;

    const handleWalletClick = () => {
        if (account) {
            disconnectWallet();
        } else {
            connectWallet();
        }
    };

    return (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-6">
            <Link
                href="/managers"
                className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-blue-600 hover:scale-110 transition-all border-4 border-blue-50 group relative hover:border-blue-200"
            >
                <span className="text-3xl">💼</span>
                <span className="absolute left-20 bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap -translate-x-2 group-hover:translate-x-0">
                    Find Agents
                </span>
            </Link>

            <Link
                href="/buy-tokens"
                className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-teal-600 hover:scale-110 transition-all border-4 border-teal-50 group relative hover:border-teal-200"
            >
                <span className="text-3xl">🪙</span>
                <span className="absolute left-20 bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap -translate-x-2 group-hover:translate-x-0">
                    Buy Tokens
                </span>
            </Link>

            <button
                onClick={handleWalletClick}
                className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all border-4 group relative ${account
                    ? 'bg-green-50 border-green-500 text-green-600 hover:border-red-500 hover:bg-red-50 hover:text-red-600'
                    : 'bg-white border-orange-50 text-orange-600 hover:border-orange-200 hover:scale-110'
                    }`}
            >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                    {account ? (
                        <>
                            <span className="group-hover:hidden">✅</span>
                            <span className="hidden group-hover:inline">🚪</span>
                        </>
                    ) : '🦊'}
                </span>
                <span className="absolute left-20 bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap -translate-x-2 group-hover:translate-x-0">
                    {account ? 'Disconnect Wallet' : 'Connect Wallet'}
                </span>
            </button>
        </div>
    );
}
