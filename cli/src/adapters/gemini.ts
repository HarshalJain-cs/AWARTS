/**
 * Gemini adapter -- reads local usage data or estimates costs from Google AI API key.
 *
 * Primary: Local file reading from ~/.gemini/usage/ (Gemini CLI)
 * Secondary: Google AI Studio API for token usage (requires API key)
 * Fallback: Token-based cost estimation using pricing table
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Adapter, UsageEntry } from '../types.js';
import { getKey } from '../lib/keys.js';

const HOME = os.homedir();

const LOCAL_DIRS = [
  path.join(HOME, '.gemini', 'usage'),
  path.join(HOME, '.config', 'gemini', 'usage'),
  path.join(HOME, '.gemini'),
];

// ── Gemini Pricing (per million tokens, USD) ────────────────────────────
// Source: Google AI pricing as of 2025
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-pro':        { input: 1.25, output: 10.00 },
  'gemini-2.5-flash':      { input: 0.15, output: 0.60 },
  'gemini-2.0-flash':      { input: 0.10, output: 0.40 },
  'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro':        { input: 1.25, output: 5.00 },
  'gemini-1.5-flash':      { input: 0.075, output: 0.30 },
  'gemini-1.5-flash-8b':   { input: 0.0375, output: 0.15 },
};
const DEFAULT_PRICING = { input: 0.15, output: 0.60 }; // Flash pricing as default

function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model?: string
): number {
  const pricing = (model && GEMINI_PRICING[model]) || DEFAULT_PRICING;
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

// ── Local file reading ──────────────────────────────────────────────────

interface GeminiUsageFile {
  date?: string;
  cost_usd?: number;
  total_cost?: number;
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_tokens?: number;
  cache_read_tokens?: number;
  models?: string[];
  model?: string;
  [key: string]: unknown;
}

function dateFromFilename(filename: string): string | null {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
  return match ? match[1] : null;
}

async function dirExists(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function findUsageDir(): Promise<string | null> {
  for (const dir of LOCAL_DIRS) {
    if (await dirExists(dir)) return dir;
  }
  return null;
}

async function readLocalFiles(): Promise<UsageEntry[]> {
  const entries: UsageEntry[] = [];
  const dir = await findUsageDir();
  if (!dir) return entries;

  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return entries;
  }

  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(dir, file);
      const raw = await fs.readFile(filePath, 'utf-8');
      const data: GeminiUsageFile = JSON.parse(raw);

      const date = data.date ?? dateFromFilename(file);
      if (!date) continue;

      const costUsd = data.cost_usd ?? data.total_cost ?? 0;
      const inputTokens = Number(data.input_tokens ?? 0) || 0;
      const outputTokens = Number(data.output_tokens ?? 0) || 0;
      const model = data.model ?? (data.models?.[0]);

      // If we have tokens but no cost, estimate
      let finalCost = Number(costUsd) || 0;
      let costSource: 'real' | 'estimated' = finalCost > 0 ? 'real' : 'estimated';
      if (finalCost === 0 && (inputTokens > 0 || outputTokens > 0)) {
        finalCost = estimateCost(inputTokens, outputTokens, model);
        costSource = 'estimated';
      }

      entries.push({
        date,
        provider: 'gemini',
        cost_usd: finalCost,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_creation_tokens: Number(data.cache_creation_tokens ?? 0) || 0,
        cache_read_tokens: Number(data.cache_read_tokens ?? 0) || 0,
        models: data.models ?? (data.model ? [data.model] : []),
        cost_source: costSource,
      });
    } catch {
      // Skip unparseable files silently.
    }
  }

  return entries;
}

// ── Adapter export ──────────────────────────────────────────────────────

export const geminiAdapter: Adapter = {
  name: 'gemini',
  displayName: 'Gemini',

  async detect(): Promise<boolean> {
    // Detected if API key exists OR local files exist
    const apiKey = await getKey('google');
    if (apiKey) return true;
    return (await findUsageDir()) !== null;
  },

  async read(): Promise<UsageEntry[]> {
    // Read local files (primary source for Gemini since there's no billing API)
    const localEntries = await readLocalFiles();
    if (localEntries.length > 0) return localEntries;

    // If we have an API key but no local files, we can't fetch usage history
    // from Google AI Studio (no billing API equivalent exists).
    // Return empty — user should use web import for historical data.
    return [];
  },
};
