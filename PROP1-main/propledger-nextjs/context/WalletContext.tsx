'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
    walletAddress: string | null;
    isConnecting: boolean;
    error: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    checkWalletConnection: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkWalletConnection();

        // Listen for account changes
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                } else {
                    setWalletAddress(null);
                }
            });
        }

        return () => {
            // Cleanup listener if possible (optional)
        };
    }, []);

    const checkWalletConnection = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                }
            } catch (err) {
                console.error("Error checking wallet connection:", err);
            }
        }
    };

    const connectWallet = async () => {
        setIsConnecting(true);
        setError(null);
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                setWalletAddress(accounts[0]);
            } catch (err: any) {
                console.error('User denied account access');
                setError(err.message || 'Failed to connect wallet');
            } finally {
                setIsConnecting(false);
            }
        } else {
            setIsConnecting(false);
            window.open('https://metamask.io/download/', '_blank');
            setError('MetaMask is not installed');
        }
    };

    const disconnectWallet = () => {
        setWalletAddress(null);
    };

    return (
        <WalletContext.Provider
            value={{
                walletAddress,
                isConnecting,
                error,
                connectWallet,
                disconnectWallet,
                checkWalletConnection
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
