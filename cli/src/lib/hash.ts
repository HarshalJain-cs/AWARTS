/**
 * Deterministic hashing for usage-data deduplication.
 *
 * Generates a SHA-256 hex digest over the canonical JSON representation of
 * one or more usage entries.  The backend stores this hash alongside the
 * data so it can reject duplicate submissions.
 */

import { createHash } from 'node:crypto';
import type { UsageEntry } from '../types.js';

/**
 * Produce a stable hash for an array of usage entries.
 *
 * The entries are sorted by (date, provider) and then serialised with
 * sorted keys so the output is independent of insertion order.
 */
export function hashEntries(entries: UsageEntry[]): string {
  const sorted = [...entries].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.provider.localeCompare(b.provider);
  });

  const canonical = JSON.stringify(sorted, Object.keys(sorted[0] ?? {}).sort());

  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Hash a single entry (convenience wrapper).
 */
export function hashEntry(entry: UsageEntry): string {
  return hashEntries([entry]);
}
