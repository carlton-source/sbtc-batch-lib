/**
 * useContract Hook - Contract Interactions for sBTC Batch Transfer
 * 
 * Provides easy access to contract functions with loading/error states.
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  validateBatch,
  calculateBatchTotal,
  getSenderStats,
  getContractInfo,
  getRecipientReceived,
  batchTransferSbtc,
  batchTransferMock,
  mintMockSbtc,
  getMockSbtcBalance,
  getExplorerUrl,
  parseContractError,
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  SBTC_CONTRACT,
  MOCK_SBTC_CONTRACT,
  NETWORK,
  MAX_RECIPIENTS,
  type RecipientInput,
  type BatchValidationResult,
  type SenderStats,
  type ContractInfo,
} from '@/lib/contract';

export interface UseContractReturn {
  // Contract info
  contractAddress: string;
  contractName: string;
  sbtcContract: string;
  mockSbtcContract: string;
  network: string;
  maxRecipients: number;
  
  // Read-only functions
  validateBatch: (recipients: RecipientInput[]) => Promise<BatchValidationResult>;
  calculateTotal: (recipients: RecipientInput[]) => Promise<number>;
  getStats: () => Promise<SenderStats>;
  getContractInfo: () => Promise<ContractInfo>;
  getRecipientReceived: (address: string) => Promise<number>;
  getMockBalance: (address?: string) => Promise<number>;
  
  // Write functions
  executeBatch: (recipients: RecipientInput[], useMock?: boolean) => Promise<{ txId: string; success: boolean }>;
  mintTestTokens: (amount: number, recipient?: string) => Promise<{ txId: string; success: boolean }>;
  
  // State
  isLoading: boolean;
  error: string | null;
  lastTxId: string | null;
  
  // Utilities
  getExplorerUrl: (txId: string) => string;
  parseError: (code: number) => string;
  clearError: () => void;
}

export function useContract(): UseContractReturn {
  const { stxAddress, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxId, setLastTxId] = useState<string | null>(null);

  const requireConnection = useCallback(() => {
    if (!isConnected || !stxAddress) {
      throw new Error('Wallet not connected');
    }
    return stxAddress;
  }, [isConnected, stxAddress]);

  // Validate batch
  const validateBatchFn = useCallback(async (recipients: RecipientInput[]): Promise<BatchValidationResult> => {
    const sender = requireConnection();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await validateBatch(recipients, sender);
      return result;
    } catch (err: any) {
      setError(err.message || 'Validation failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [requireConnection]);

  // Calculate total
  const calculateTotalFn = useCallback(async (recipients: RecipientInput[]): Promise<number> => {
    const sender = requireConnection();
    
    try {
      return await calculateBatchTotal(recipients, sender);
    } catch (err: any) {
      console.error('Calculate total error:', err);
      // Fallback to local calculation
      return recipients.reduce((sum, r) => sum + r.amount, 0);
    }
  }, [requireConnection]);

  // Get sender stats
  const getStatsFn = useCallback(async (): Promise<SenderStats> => {
    const sender = requireConnection();
    setIsLoading(true);
    
    try {
      return await getSenderStats(sender);
    } catch (err: any) {
      console.error('Get stats error:', err);
      return { totalBatches: 0, totalRecipients: 0, totalAmount: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [requireConnection]);

  // Get contract info
  const getContractInfoFn = useCallback(async (): Promise<ContractInfo> => {
    const sender = requireConnection();
    
    try {
      return await getContractInfo(sender);
    } catch {
      return { maxRecipients: MAX_RECIPIENTS, version: '1.0.0' };
    }
  }, [requireConnection]);

  // Get recipient received
  const getRecipientReceivedFn = useCallback(async (address: string): Promise<number> => {
    const sender = requireConnection();
    
    try {
      return await getRecipientReceived(address, sender);
    } catch {
      return 0;
    }
  }, [requireConnection]);

  // Get mock sBTC balance
  const getMockBalanceFn = useCallback(async (address?: string): Promise<number> => {
    const sender = requireConnection();
    const targetAddress = address || sender;
    
    try {
      return await getMockSbtcBalance(targetAddress, sender);
    } catch {
      return 0;
    }
  }, [requireConnection]);

  // Execute batch transfer
  const executeBatchFn = useCallback(async (
    recipients: RecipientInput[],
    useMock = true
  ): Promise<{ txId: string; success: boolean }> => {
    const sender = requireConnection();
    setIsLoading(true);
    setError(null);
    setLastTxId(null);
    
    try {
      const result = useMock
        ? await batchTransferMock(recipients, sender)
        : await batchTransferSbtc(recipients, sender);
      
      setLastTxId(result.txId);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [requireConnection]);

  // Mint test tokens
  const mintTestTokensFn = useCallback(async (
    amount: number,
    recipient?: string
  ): Promise<{ txId: string; success: boolean }> => {
    const sender = requireConnection();
    const targetRecipient = recipient || sender;
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await mintMockSbtc(amount, targetRecipient);
      setLastTxId(result.txId);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Mint failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [requireConnection]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Contract info
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    sbtcContract: SBTC_CONTRACT,
    mockSbtcContract: MOCK_SBTC_CONTRACT,
    network: NETWORK,
    maxRecipients: MAX_RECIPIENTS,
    
    // Read-only functions
    validateBatch: validateBatchFn,
    calculateTotal: calculateTotalFn,
    getStats: getStatsFn,
    getContractInfo: getContractInfoFn,
    getRecipientReceived: getRecipientReceivedFn,
    getMockBalance: getMockBalanceFn,
    
    // Write functions
    executeBatch: executeBatchFn,
    mintTestTokens: mintTestTokensFn,
    
    // State
    isLoading,
    error,
    lastTxId,
    
    // Utilities
    getExplorerUrl,
    parseError: parseContractError,
    clearError,
  };
}

export { type RecipientInput, type BatchValidationResult, type SenderStats, type ContractInfo };
