import type { Metadata } from 'next';
import './globals.css';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

import { WalletProvider } from '@/context/WalletContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'PROPLEDGER - CDA-Compliant Blockchain Real Estate Platform',
  description: 'CDA-Compliant Blockchain Real Estate Platform. Invest in tokenized real estate properties with blockchain security and CDA-Compliant standards',
  keywords: 'blockchain, real estate, investment, tokenization, property, CDA, Pakistan, CDA-Compliant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SessionProviderWrapper>
            <WalletProvider>
              {children}
            </WalletProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
