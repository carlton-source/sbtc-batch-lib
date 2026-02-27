/**
 * Contract Integration for sBTC Batch Transfer
 * 
 * Contract: ST262DFWDS07XGFC8HYE4H7MAESRD6M6G1B3K48JF.batch-transfer
 * sBTC Token: ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token
 * Mock sBTC: ST262DFWDS07XGFC8HYE4H7MAESRD6M6G1B3K48JF.mock-sbtc
 */

import { request } from '@stacks/connect';
import { Cl, Pc, cvToValue, fetchCallReadOnlyFunction, principalCV } from '@stacks/transactions';

// Contract addresses (Testnet)
export const CONTRACT_ADDRESS = 'ST262DFWDS07XGFC8HYE4H7MAESRD6M6G1B3K48JF';
export const CONTRACT_NAME = 'batch-transfer';
export const SBTC_CONTRACT = 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token';
export const MOCK_SBTC_CONTRACT = `${CONTRACT_ADDRESS}.mock-sbtc`;

export const NETWORK = 'testnet' as const;
export const MAX_RECIPIENTS = 200;

// Error code mappings
export const CONTRACT_ERRORS: Record<number, string> = {
  100: 'Empty batch - no recipients provided',
  101: 'Batch too large - max 200 recipients',
  102: 'Zero amount not allowed',
  103: 'Transfer failed - insufficient balance or authorization',
  104: 'Unauthorized (admin functions only)',
};

export interface RecipientInput {
  address: string;
  amount: number; // in sats
}

export interface BatchValidationResult {
  valid: boolean;
  recipientCount: number;
  totalAmount: number;
}

export interface SenderStats {
  totalBatches: number;
  totalRecipients: number;
  totalAmount: number;
}

export interface ContractInfo {
  maxRecipients: number;
  version: string;
}

/**
 * Validate a batch before execution (read-only)
 */
export async function validateBatch(
  recipients: RecipientInput[],
  senderAddress: string
): Promise<BatchValidationResult> {
  try {
    const recipientTuples = recipients.map((r) =>
      Cl.tuple({
        to: Cl.principal(r.address),
        amount: Cl.uint(r.amount),
      })
    );

    const response = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'validate-batch',
      functionArgs: [Cl.list(recipientTuples)],
      senderAddress,
      network: NETWORK,
    });

    const result = cvToValue(response);
    
    if (result.type === 'ok') {
      return {
        valid: true,
        recipientCount: Number(result.value['recipient-count']),
        totalAmount: Number(result.value['total-amount']),
      };
    } else {
      return {
        valid: false,
        recipientCount: recipients.length,
        totalAmount: 0,
      };
    }
  } catch (error) {
    console.error('Validation error:', error);
    return {
      valid: false,
      recipientCount: recipients.length,
      totalAmount: 0,
    };
  }
}

/**
 * Calculate total amount for a batch (read-only)
 */
export async function calculateBatchTotal(
  recipients: RecipientInput[],
  senderAddress: string
): Promise<number> {
  try {
    const recipientTuples = recipients.map((r) =>
      Cl.tuple({
        to: Cl.principal(r.address),
        amount: Cl.uint(r.amount),
      })
    );

    const response = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'calculate-batch-total',
      functionArgs: [Cl.list(recipientTuples)],
      senderAddress,
      network: NETWORK,
    });

    return Number(cvToValue(response));
  } catch (error) {
    console.error('Calculate total error:', error);
    return recipients.reduce((sum, r) => sum + r.amount, 0);
  }
}

/**
 * Get sender statistics (read-only)
 */
export async function getSenderStats(senderAddress: string): Promise<SenderStats> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-sender-stats',
      functionArgs: [principalCV(senderAddress)],
      senderAddress,
      network: NETWORK,
    });

    const result = cvToValue(response);
    return {
      totalBatches: Number(result['total-batches'] || 0),
      totalRecipients: Number(result['total-recipients'] || 0),
      totalAmount: Number(result['total-amount'] || 0),
    };
  } catch (error) {
    console.error('Get stats error:', error);
    return { totalBatches: 0, totalRecipients: 0, totalAmount: 0 };
  }
}

/**
 * Get contract info (read-only)
 */
export async function getContractInfo(senderAddress: string): Promise<ContractInfo> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-contract-info',
      functionArgs: [],
      senderAddress,
      network: NETWORK,
    });

    const result = cvToValue(response);
    return {
      maxRecipients: Number(result['max-recipients'] || MAX_RECIPIENTS),
      version: result.version || '1.0.0',
    };
  } catch (error) {
    console.error('Get contract info error:', error);
    return { maxRecipients: MAX_RECIPIENTS, version: '1.0.0' };
  }
}

/**
 * Get recipient's total received amount (read-only)
 */
export async function getRecipientReceived(
  recipientAddress: string,
  senderAddress: string
): Promise<number> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-recipient-received',
      functionArgs: [principalCV(recipientAddress)],
      senderAddress,
      network: NETWORK,
    });

    return Number(cvToValue(response) || 0);
  } catch (error) {
    console.error('Get recipient received error:', error);
    return 0;
  }
}

/**
 * Execute batch transfer with real sBTC
 */
export async function batchTransferSbtc(
  recipients: RecipientInput[],
  senderAddress: string
): Promise<{ txId: string; success: boolean }> {
  const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

  const recipientTuples = recipients.map((r) =>
    Cl.tuple({
      to: Cl.principal(r.address),
      amount: Cl.uint(r.amount),
    })
  );

  // Post-condition: sender will send exactly totalAmount of sBTC
  const postCondition = Pc.principal(senderAddress)
    .willSendEq(totalAmount)
    .ft(SBTC_CONTRACT, 'sbtc-token');

  try {
    const result = await request('stx_callContract', {
      contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
      functionName: 'batch-transfer-sbtc',
      functionArgs: [Cl.list(recipientTuples)],
      network: NETWORK,
      postConditions: [postCondition],
      postConditionMode: 'deny',
    });

    return {
      txId: result.txid,
      success: true,
    };
  } catch (error: any) {
    console.error('Batch transfer error:', error);
    throw new Error(error?.message || 'Transaction failed or was cancelled');
  }
}

/**
 * Execute batch transfer with mock sBTC (for testnet testing)
 */
export async function batchTransferMock(
  recipients: RecipientInput[],
  senderAddress: string
): Promise<{ txId: string; success: boolean }> {
  const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

  const recipientTuples = recipients.map((r) =>
    Cl.tuple({
      to: Cl.principal(r.address),
      amount: Cl.uint(r.amount),
    })
  );

  // Post-condition: sender will send exactly totalAmount of mock sBTC
  const postCondition = Pc.principal(senderAddress)
    .willSendEq(totalAmount)
    .ft(MOCK_SBTC_CONTRACT, 'mock-sbtc');

  try {
    const result = await request('stx_callContract', {
      contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
      functionName: 'batch-transfer-mock',
      functionArgs: [Cl.list(recipientTuples)],
      network: NETWORK,
      postConditions: [postCondition],
      postConditionMode: 'deny',
    });

    return {
      txId: result.txid,
      success: true,
    };
  } catch (error: any) {
    console.error('Mock batch transfer error:', error);
    throw new Error(error?.message || 'Transaction failed or was cancelled');
  }
}

/**
 * Mint mock sBTC tokens for testing
 */
export async function mintMockSbtc(
  amount: number,
  recipientAddress: string
): Promise<{ txId: string; success: boolean }> {
  try {
    const result = await request('stx_callContract', {
      contract: MOCK_SBTC_CONTRACT,
      functionName: 'mint',
      functionArgs: [Cl.uint(amount), Cl.principal(recipientAddress)],
      network: NETWORK,
    });

    return {
      txId: result.txid,
      success: true,
    };
  } catch (error: any) {
    console.error('Mint mock sBTC error:', error);
    throw new Error(error?.message || 'Mint failed or was cancelled');
  }
}

/**
 * Get mock sBTC balance
 */
export async function getMockSbtcBalance(
  address: string,
  senderAddress: string
): Promise<number> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: 'mock-sbtc',
      functionName: 'get-balance',
      functionArgs: [principalCV(address)],
      senderAddress,
      network: NETWORK,
    });

    const result = cvToValue(response);
    // Result is (ok u123) or similar
    if (result.type === 'ok') {
      return Number(result.value || 0);
    }
    return Number(result || 0);
  } catch (error) {
    console.error('Get balance error:', error);
    return 0;
  }
}

/**
 * Get Stacks Explorer URL for a transaction
 */
export function getExplorerUrl(txId: string): string {
  return `https://explorer.stacks.co/txid/${txId}?chain=testnet`;
}

/**
 * Validate a Stacks address format
 */
export function isValidStacksAddress(address: string): boolean {
  // Testnet addresses start with ST, mainnet with SP
  // Contract addresses contain a dot
  const addressPart = address.includes('.') ? address.split('.')[0] : address;
  return /^(ST|SP|SM|SN)[A-Z0-9]{8,}$/i.test(addressPart);
}

/**
 * Parse error code from contract response
 */
export function parseContractError(errorCode: number): string {
  return CONTRACT_ERRORS[errorCode] || `Unknown error (code: ${errorCode})`;
}
