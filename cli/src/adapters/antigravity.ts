/**
 * Antigravity adapter -- reads local usage data with real token/cost data only.
 *
 * Primary: Local file reading from ~/.antigravity/usage/ or ~/.gemini/antigravity/usage/
 *
 * Antigravity stores session data in ~/.gemini/antigravity/ as protobuf but
 * doesn't expose token counts in a readable format. Usage files must exist
 * as YYYY-MM-DD.json files for data to be reported.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Adapter, UsageEntry } from '../types.js';
import { getKey } from '../lib/keys.js';

const HOME = os.homedir();
const IS_WIN = process.platform === 'win32';
const LOCALAPPDATA = process.env.LOCALAPPDATA ?? path.join(HOME, 'AppData', 'Local');

// Usage file dirs (structured JSON with real data)
const LOCAL_DIRS = [
  path.join(HOME, '.antigravity', 'usage'),
  path.join(HOME, '.antigravity'),
  path.join(HOME, '.gemini', 'antigravity', 'usage'),
  ...(IS_WIN ? [
    path.join(LOCALAPPDATA, 'antigravity', 'usage'),
    path.join(LOCALAPPDATA, 'antigravity'),
  ] : []),
];

// Detection dirs
const DETECT_DIRS = [
  path.join(HOME, '.antigravity'),
  path.join(HOME, '.gemini', 'antigravity'),
  ...(IS_WIN ? [
    path.join(LOCALAPPDATA, 'antigravity'),
  ] : []),
];

// ── Antigravity Pricing (per million tokens, USD) ───────────────────────
const ANTIGRAVITY_PRICING: Record<string, { input: number; output: number }> = {
  'antigravity-1':   { input: 3.00, output: 15.00 },
  'antigravity-1.5': { input: 3.00, output: 15.00 },
  'antigravity-2':   { input: 3.00, output: 15.00 },
};
const DEFAULT_PRICING = { input: 3.00, output: 15.00 };

function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model?: string
): number {
  const pricing = (model && ANTIGRAVITY_PRICING[model]) || DEFAULT_PRICING;
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

// ── Local file reading ──────────────────────────────────────────────────

interface AntigravityUsageFile {
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
      const data: AntigravityUsageFile = JSON.parse(raw);

      const date = data.date ?? dateFromFilename(file);
      if (!date) continue;

      const costUsd = data.cost_usd ?? data.total_cost ?? 0;
      const inputTokens = Number(data.input_tokens ?? 0) || 0;
      const outputTokens = Number(data.output_tokens ?? 0) || 0;
      const model = data.model ?? (data.models?.[0]);

      // Use real cost; calculate from real token counts if cost not provided
      let finalCost = Number(costUsd) || 0;
      let costSource: 'real' | 'estimated' = finalCost > 0 ? 'real' : 'estimated';
      if (finalCost === 0 && (inputTokens > 0 || outputTokens > 0)) {
        finalCost = calculateCost(inputTokens, outputTokens, model);
        costSource = 'estimated';
      }

      entries.push({
        date,
        provider: 'antigravity',
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

export const antigravityAdapter: Adapter = {
  name: 'antigravity',
  displayName: 'Antigravity',

  async detect(): Promise<boolean> {
    // Detected if API key exists
    const apiKey = await getKey('antigravity');
    if (apiKey) return true;
    // Or any known Antigravity dir exists
    for (const dir of DETECT_DIRS) {
      if (await dirExists(dir)) return true;
    }
    return false;
  },

  async read(): Promise<UsageEntry[]> {
    // Only read structured usage files (real data)
    return readLocalFiles();
  },
};
