/**
 * Codex (OpenAI) adapter -- fetches real billing data from the OpenAI Costs API.
 *
 * Primary: OpenAI Costs API (requires API key in ~/.awarts/keys.json)
 * Fallback: Local file reading from ~/.codex/usage/ (if files exist)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Adapter, UsageEntry } from '../types.js';
import { getKey } from '../lib/keys.js';

const HOME = os.homedir();

const LOCAL_DIRS = [
  path.join(HOME, '.codex', 'usage'),
  path.join(HOME, '.openai-codex', 'usage'),
  path.join(HOME, '.codex'),
];

// ── OpenAI Costs API ────────────────────────────────────────────────────

interface OpenAICostsBucket {
  start_time: number; // Unix seconds
  end_time: number;
  results: Array<{
    object: string;
    amount: { value: number; currency: string };
    line_item?: string;
    project_id?: string;
  }>;
}

interface OpenAICostsResponse {
  object: string;
  data: OpenAICostsBucket[];
  has_more: boolean;
  next_page?: string;
}

async function fetchOpenAICosts(apiKey: string): Promise<UsageEntry[]> {
  const entries: UsageEntry[] = [];
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

  let url = `https://api.openai.com/v1/organization/costs?start_time=${thirtyDaysAgo}&end_time=${now}&bucket_width=1d&limit=30`;

  try {
    while (url) {
      const resp = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) {
        // API key might be invalid or not have billing permissions
        return [];
      }

      const data: OpenAICostsResponse = await resp.json();

      for (const bucket of data.data) {
        const date = new Date(bucket.start_time * 1000).toISOString().split('T')[0];
        const totalCost = bucket.results.reduce((sum, r) => sum + r.amount.value, 0);

        if (totalCost > 0) {
          entries.push({
            date,
            provider: 'codex',
            cost_usd: totalCost / 100, // OpenAI returns cents
            input_tokens: 0,  // Costs API doesn't break down tokens
            output_tokens: 0,
            models: ['openai-codex'],
            cost_source: 'real',
          });
        }
      }

      url = data.has_more && data.next_page ? data.next_page : '';
    }
  } catch {
    // Network error, API unavailable, etc.
    return [];
  }

  return entries;
}

// ── Local file fallback ─────────────────────────────────────────────────

interface CodexUsageFile {
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
      const data: CodexUsageFile = JSON.parse(raw);

      const date = data.date ?? dateFromFilename(file);
      if (!date) continue;

      const costUsd = data.cost_usd ?? data.total_cost ?? 0;

      entries.push({
        date,
        provider: 'codex',
        cost_usd: Number(costUsd) || 0,
        input_tokens: Number(data.input_tokens ?? 0) || 0,
        output_tokens: Number(data.output_tokens ?? 0) || 0,
        cache_creation_tokens: Number(data.cache_creation_tokens ?? 0) || 0,
        cache_read_tokens: Number(data.cache_read_tokens ?? 0) || 0,
        models: data.models ?? (data.model ? [data.model] : []),
        cost_source: costUsd > 0 ? 'real' : 'estimated',
      });
    } catch {
      // Skip unparseable files silently.
    }
  }

  return entries;
}

// ── Adapter export ──────────────────────────────────────────────────────

export const codexAdapter: Adapter = {
  name: 'codex',
  displayName: 'Codex (OpenAI)',

  async detect(): Promise<boolean> {
    // Detected if API key exists OR local files exist
    const apiKey = await getKey('openai');
    if (apiKey) return true;
    return (await findUsageDir()) !== null;
  },

  async read(): Promise<UsageEntry[]> {
    // Try API first (real billing data)
    const apiKey = await getKey('openai');
    if (apiKey) {
      const apiEntries = await fetchOpenAICosts(apiKey);
      if (apiEntries.length > 0) return apiEntries;
    }

    // Fall back to local files
    return readLocalFiles();
  },
};
