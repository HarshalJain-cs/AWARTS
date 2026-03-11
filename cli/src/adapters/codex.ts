/**
 * Codex (OpenAI) adapter -- fetches real billing data from the OpenAI Costs API.
 *
 * Primary: OpenAI Costs API (requires API key in ~/.awarts/keys.json)
 * Fallback: Local file reading from various Codex CLI data directories
 *
 * Detection: Checks for OpenAI API key, Codex CLI config dirs, or
 * the `codex` command being available in PATH.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import type { Adapter, UsageEntry } from '../types.js';
import { getKey } from '../lib/keys.js';

const HOME = os.homedir();
const IS_WIN = process.platform === 'win32';
const LOCALAPPDATA = process.env.LOCALAPPDATA ?? path.join(HOME, 'AppData', 'Local');
const APPDATA = process.env.APPDATA ?? path.join(HOME, 'AppData', 'Roaming');

// All possible locations where Codex CLI stores usage/config data
const LOCAL_DIRS = [
  path.join(HOME, '.codex', 'usage'),
  path.join(HOME, '.openai-codex', 'usage'),
  path.join(HOME, '.codex'),
  path.join(HOME, '.openai-codex'),
  // Windows-specific paths
  ...(IS_WIN ? [
    path.join(LOCALAPPDATA, 'codex', 'usage'),
    path.join(LOCALAPPDATA, 'openai-codex', 'usage'),
    path.join(APPDATA, 'codex', 'usage'),
    path.join(APPDATA, 'openai-codex', 'usage'),
    path.join(LOCALAPPDATA, 'codex'),
    path.join(APPDATA, 'codex'),
  ] : []),
];

// Config dirs to check for detection (proves Codex is installed)
const CONFIG_DIRS = [
  path.join(HOME, '.codex'),
  path.join(HOME, '.openai-codex'),
  ...(IS_WIN ? [
    path.join(LOCALAPPDATA, 'codex'),
    path.join(APPDATA, 'codex'),
    path.join(LOCALAPPDATA, 'openai-codex'),
    path.join(APPDATA, 'openai-codex'),
  ] : []),
];

// ── OpenAI Pricing (per million tokens, USD) ────────────────────────────
// Updated: March 2026 — https://developers.openai.com/api/docs/pricing/
const CODEX_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5.4':        { input: 2.50,  output: 15.00 },
  'gpt-5.4-pro':    { input: 30.00, output: 180.00 },
  'gpt-5.2':        { input: 1.75,  output: 14.00 },
  'gpt-5.1':        { input: 1.25,  output: 10.00 },
  'gpt-5':          { input: 1.25,  output: 10.00 },
  'gpt-5-mini':     { input: 0.25,  output: 2.00 },
  'gpt-5-nano':     { input: 0.05,  output: 0.40 },
  'gpt-4.1':        { input: 2.00,  output: 8.00 },
  'gpt-4.1-mini':   { input: 0.40,  output: 1.60 },
  'gpt-4.1-nano':   { input: 0.10,  output: 0.40 },
  'gpt-4o':         { input: 2.50,  output: 10.00 },
  'gpt-4o-mini':    { input: 0.15,  output: 0.60 },
  'o3':             { input: 2.00,  output: 8.00 },
  'o3-pro':         { input: 20.00, output: 80.00 },
  'o4-mini':        { input: 1.10,  output: 4.40 },
  'o1':             { input: 15.00, output: 60.00 },
  'o1-pro':         { input: 150.00, output: 600.00 },
  'codex-mini':     { input: 1.50,  output: 6.00 },
  'openai-codex':   { input: 2.00,  output: 8.00 },
};
const DEFAULT_PRICING = { input: 2.00, output: 8.00 }; // GPT-4.1 tier default

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

function commandExists(cmd: string): boolean {
  try {
    execSync(IS_WIN ? `where ${cmd}` : `which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
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
      const inputTokens = Number(data.input_tokens ?? 0) || 0;
      const outputTokens = Number(data.output_tokens ?? 0) || 0;
      const model = data.model ?? (data.models?.[0]);

      // Estimate cost from tokens if not provided
      let finalCost = Number(costUsd) || 0;
      let costSource: 'real' | 'estimated' = finalCost > 0 ? 'real' : 'estimated';
      if (finalCost === 0 && (inputTokens > 0 || outputTokens > 0)) {
        const pricing = (model && CODEX_PRICING[model]) || DEFAULT_PRICING;
        finalCost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
        costSource = 'estimated';
      }

      entries.push({
        date,
        provider: 'codex',
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

// ── SQLite fallback: read Codex state_5.sqlite threads table ────────────

const SQLITE_PATHS = [
  path.join(HOME, '.codex', 'state_5.sqlite'),
  ...(IS_WIN ? [
    path.join(LOCALAPPDATA, 'codex', 'state_5.sqlite'),
    path.join(APPDATA, 'codex', 'state_5.sqlite'),
  ] : []),
];

async function findSqliteDb(): Promise<string | null> {
  for (const p of SQLITE_PATHS) {
    try {
      await fs.access(p);
      return p;
    } catch { /* not found */ }
  }
  return null;
}

async function readSqliteThreads(): Promise<UsageEntry[]> {
  const dbPath = await findSqliteDb();
  if (!dbPath) return [];

  // Use the system sqlite3 CLI to query — avoids native module dependency
  try {
    const query = `SELECT date(created_at/1000000000, 'unixepoch') as day, tokens_used, model_provider FROM threads WHERE tokens_used > 0 ORDER BY created_at;`;
    const result = execSync(`sqlite3 "${dbPath}" "${query}"`, {
      timeout: 5000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (!result) return [];

    // Group by date
    const dayMap = new Map<string, { tokens: number; models: Set<string> }>();
    for (const line of result.split('\n')) {
      const [day, tokensStr, model] = line.split('|');
      if (!day) continue;
      const tokens = Number(tokensStr) || 0;
      if (!dayMap.has(day)) dayMap.set(day, { tokens: 0, models: new Set() });
      const entry = dayMap.get(day)!;
      entry.tokens += tokens;
      if (model) entry.models.add(model);
    }

    const entries: UsageEntry[] = [];
    for (const [date, { tokens, models }] of dayMap) {
      // Codex threads track total tokens (not split input/output), estimate 40% input 60% output
      const inputTokens = Math.round(tokens * 0.4);
      const outputTokens = Math.round(tokens * 0.6);
      const modelName = [...models][0] ?? 'openai-codex';
      const pricing = CODEX_PRICING[modelName] || DEFAULT_PRICING;
      const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;

      entries.push({
        date,
        provider: 'codex',
        cost_usd: cost,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        models: [...models].length > 0 ? [...models] : ['openai-codex'],
        cost_source: 'estimated',
      });
    }

    return entries;
  } catch {
    // sqlite3 not available or query failed — that's fine
    return [];
  }
}

// ── Adapter export ──────────────────────────────────────────────────────

export const codexAdapter: Adapter = {
  name: 'codex',
  displayName: 'Codex (OpenAI)',

  async detect(): Promise<boolean> {
    // Detected if API key exists
    const apiKey = await getKey('openai');
    if (apiKey) return true;
    // Or local usage dir exists
    if ((await findUsageDir()) !== null) return true;
    // Or SQLite database exists
    if ((await findSqliteDb()) !== null) return true;
    // Or any config dir exists
    for (const dir of CONFIG_DIRS) {
      if (await dirExists(dir)) return true;
    }
    // Or the codex CLI command is available
    if (commandExists('codex')) return true;
    return false;
  },

  async read(): Promise<UsageEntry[]> {
    // Try API first (real billing data)
    const apiKey = await getKey('openai');
    if (apiKey) {
      const apiEntries = await fetchOpenAICosts(apiKey);
      if (apiEntries.length > 0) return apiEntries;
    }

    // Fall back to local JSON files
    const localEntries = await readLocalFiles();
    if (localEntries.length > 0) return localEntries;

    // Fall back to SQLite threads database
    return readSqliteThreads();
  },
};
