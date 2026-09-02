/**
 * Local Cryptographic Hash Chain Engine
 * Provides immediate tamper-evidence across the audit log sequence.
 * Formula: H_n = SHA-256(dataHash + previousAuditHash)
 */

import { computeSha256 } from "./canonicalizer";

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export interface ChainRecord {
  proofId: string;
  dataHash: string;
  previousAuditHash?: string;
  chainHash: string;
  occurredAt: number;
}

export function computeChainHash(dataHash: string, previousAuditHash?: string): string {
  const prev = previousAuditHash || GENESIS_HASH;
  return computeSha256(`${dataHash}:${prev}`);
}

export function verifyHashChainIntegrity(records: ChainRecord[]): {
  isValid: boolean;
  brokenRecordId?: string;
  reason?: string;
} {
  if (!records || records.length === 0) {
    return { isValid: true };
  }

  // Expect chronological order (oldest to newest)
  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const prevHash = record.previousAuditHash || GENESIS_HASH;

    // Check link continuity
    if (prevHash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenRecordId: record.proofId,
        reason: `Chain break at index ${i} (${record.proofId}): expected previous hash ${expectedPrevHash.substring(0, 10)}... but observed ${prevHash.substring(0, 10)}...`,
      };
    }

    // Check chain hash formula
    const expectedChainHash = computeChainHash(record.dataHash, prevHash);
    if (record.chainHash !== expectedChainHash) {
      return {
        isValid: false,
        brokenRecordId: record.proofId,
        reason: `Cryptographic invalidity at index ${i} (${record.proofId}): recalculated chain hash does not match stored hash`,
      };
    }

    expectedPrevHash = record.chainHash;
  }

  return { isValid: true };
}
