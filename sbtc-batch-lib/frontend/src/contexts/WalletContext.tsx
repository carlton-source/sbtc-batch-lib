/**
 * WalletContext - Real Stacks Wallet Integration
 * 
 * Uses @stacks/connect for wallet connection with automatic session persistence.
 * The connect() function stores addresses in localStorage automatically,
 * and isConnected() checks if a session exists.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connect, disconnect as stacksDisconnect, isConnected as stacksIsConnected } from '@stacks/connect';
import type { AddressesResult } from '@stacks/connect';

export type WalletName = 'Leather' | 'Xverse' | 'Other';

interface WalletAddress {
  symbol: string;
  address: string;
  publicKey?: string;
}

interface WalletContextValue {
  // Connection state
  stxAddress: string | null;
  btcAddress: string | null;
  walletName: WalletName | null;
  addresses: WalletAddress[];
  isConnected: boolean;
  isConnecting: boolean;
  connectingWallet: WalletName | null;
  
  // Network info
  network: 'testnet' | 'mainnet';
  isTestnet: boolean;
  
  // Actions
  connectWallet: (preferredWallet?: WalletName) => Promise<void>;
  disconnectWallet: () => void;
  
  // Legacy compatibility
  connectAs: (wallet: WalletName) => Promise<void>;
  disconnect: () => void;
  
  // Utilities
  truncateAddress: (address: string, chars?: number) => string;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// Helper to detect wallet name from provider
function detectWalletName(): WalletName {
  // This is a heuristic - the actual provider detection happens at connect time
  return 'Leather';
}

// Network configuration
export const CURRENT_NETWORK: 'testnet' | 'mainnet' = 'testnet';

// Helper to check if address is testnet (starts with ST)
function isTestnetAddress(address: string): boolean {
  return address.startsWith('ST') || address.startsWith('SN');
}

// Helper to check if address is mainnet (starts with SP)
function isMainnetAddress(address: string): boolean {
  return address.startsWith('SP') || address.startsWith('SM');
}

// Helper to find STX address from addresses array
function findStxAddress(addresses: WalletAddress[]): string | null {
  const stxAddr = addresses.find(a => a.symbol === 'STX');
  return stxAddr?.address ?? null;
}

// Helper to find BTC address from addresses array  
function findBtcAddress(addresses: WalletAddress[]): string | null {
  const btcAddr = addresses.find(a => a.symbol === 'BTC');
  return btcAddr?.address ?? null;
}

// Storage keys for wallet session persistence
const WALLET_SESSION_KEY = 'batchpay_wallet_session';

interface WalletSession {
  walletName: WalletName;
  connectedAt: string;
  addresses: WalletAddress[];
}

function saveWalletSession(session: WalletSession): void {
  try {
    localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
}

function loadWalletSession(): WalletSession | null {
  try {
    const stored = localStorage.getItem(WALLET_SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function clearWalletSession(): void {
  try {
    localStorage.removeItem(WALLET_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<WalletAddress[]>([]);
  const [walletName, setWalletName] = useState<WalletName | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<WalletName | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Derived state
  const stxAddress = findStxAddress(addresses);
  const btcAddress = findBtcAddress(addresses);
  const isConnected = addresses.length > 0 && stxAddress !== null;

  // Initialize: Restore session from localStorage on mount (NO popup)
  useEffect(() => {
    const initializeConnection = () => {
      try {
        // Check our stored session - don't call connect() which shows popup
        const session = loadWalletSession();
        
        if (session && session.addresses.length > 0) {
          // Verify @stacks/connect thinks we're connected
          if (stacksIsConnected()) {
            // Validate testnet addresses on restore
            const stxAddr = findStxAddress(session.addresses);
            if (stxAddr && CURRENT_NETWORK === 'testnet' && !isTestnetAddress(stxAddr)) {
              // Mainnet address found but we're on testnet - clear session
              console.warn('Stored session has mainnet address, clearing for testnet');
              stacksDisconnect();
              clearWalletSession();
            } else {
              setAddresses(session.addresses);
              setWalletName(session.walletName);
            }
          } else {
            // Stacks connect says not connected, clear our session too
            clearWalletSession();
          }
        }
      } catch (error) {
        console.error('Error initializing wallet connection:', error);
        // Clear any stale state
        setAddresses([]);
        setWalletName(null);
        clearWalletSession();
      } finally {
        setInitialized(true);
      }
    };

    initializeConnection();
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async (preferredWallet?: WalletName) => {
    setIsConnecting(true);
    setConnectingWallet(preferredWallet ?? null);

    try {
      // Build connect options
      const connectOptions: Parameters<typeof connect>[0] = {};
      
      // If user has a preference, we can filter providers
      // Note: Provider IDs are 'LeatherProvider', 'xverse', etc.
      if (preferredWallet) {
        if (preferredWallet === 'Leather') {
          connectOptions.approvedProviderIds = ['LeatherProvider'];
        } else if (preferredWallet === 'Xverse') {
          connectOptions.approvedProviderIds = ['xverse'];
        }
      }

      // Call connect - this shows the wallet selector modal
      // and stores addresses in localStorage automatically
      const response: AddressesResult = await connect(connectOptions);

      if (response?.addresses && response.addresses.length > 0) {
        const walletAddresses: WalletAddress[] = response.addresses.map(addr => ({
          symbol: addr.symbol,
          address: addr.address,
          publicKey: addr.publicKey,
        }));

        // Find the STX address to validate network
        const stxAddr = findStxAddress(walletAddresses);
        
        // Validate testnet requirement
        if (CURRENT_NETWORK === 'testnet' && stxAddr) {
          if (isMainnetAddress(stxAddr)) {
            // User connected with mainnet - disconnect and throw error
            stacksDisconnect();
            throw new Error(
              'Please switch to testnet in your wallet. This app is currently running on testnet only. ' +
              'In Leather: Settings → Network → Testnet. In Xverse: Settings → Network → Testnet.'
            );
          }
        }

        setAddresses(walletAddresses);
        
        const detectedWallet = preferredWallet ?? detectWalletName();
        setWalletName(detectedWallet);
        
        // Save full session for persistence across refresh
        saveWalletSession({
          walletName: detectedWallet,
          connectedAt: new Date().toISOString(),
          addresses: walletAddresses,
        });
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      // User cancelled or error occurred
      throw error;
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    // Clear @stacks/connect state (clears localStorage)
    stacksDisconnect();
    
    // Clear our state
    setAddresses([]);
    setWalletName(null);
    clearWalletSession();
  }, []);

  // Utility: Truncate address for display
  const truncateAddress = useCallback((address: string, chars = 4): string => {
    if (!address) return '';
    if (address.length <= chars * 2 + 3) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }, []);

  // Don't render children until initialized to prevent flash
  if (!initialized) {
    return null;
  }

  return (
    <WalletContext.Provider
      value={{
        stxAddress,
        btcAddress,
        walletName,
        addresses,
        isConnected,
        isConnecting,
        connectingWallet,
        network: CURRENT_NETWORK,
        isTestnet: CURRENT_NETWORK === 'testnet',
        connectWallet,
        disconnectWallet,
        // Legacy compatibility
        connectAs: connectWallet,
        disconnect: disconnectWallet,
        truncateAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
