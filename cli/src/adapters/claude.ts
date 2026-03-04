/**
 * Claude adapter -- reads local usage data from Claude Code's stats cache.
 *
 * Claude Code stores usage data in:  ~/.claude/stats-cache.json
 *
 * The file contains:
 * - dailyModelTokens: per-day output tokens broken down by model
 * - modelUsage: aggregate totals (input, output, cache tokens, cost)
 * - dailyActivity: per-day session/message/tool-call counts
 *
 * We distribute the aggregate input/cache/cost totals across days
 * proportionally based on each day's share of total output tokens.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Adapter, UsageEntry } from '../types.js';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const STATS_CACHE = path.join(CLAUDE_DIR, 'stats-cache.json');

// ── stats-cache.json shape ──────────────────────────────────────────────

interface DailyModelTokens {
  date: string;
  tokensByModel: Record<string, number>; // model -> output tokens
}

interface ModelUsageEntry {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  costUSD: number;
}

interface StatsCache {
  version?: number;
  dailyModelTokens?: DailyModelTokens[];
  modelUsage?: Record<string, ModelUsageEntry>;
  dailyActivity?: Array<{
    date: string;
    messageCount: number;
    sessionCount: number;
    toolCallCount: number;
  }>;
  totalSessions?: number;
}

// ── Pricing per million tokens (USD) ─────────────────────────────────────
// Used to estimate cost when stats-cache.json reports costUSD = 0.

interface ModelPricing {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-6':    { input: 15,  output: 75,  cacheRead: 1.875, cacheWrite: 18.75 },
  'claude-opus-4':      { input: 15,  output: 75,  cacheRead: 1.875, cacheWrite: 18.75 },
  'claude-sonnet-4':    { input: 3,   output: 15,  cacheRead: 0.30,  cacheWrite: 3.75  },
  'claude-sonnet-3-5':  { input: 3,   output: 15,  cacheRead: 0.30,  cacheWrite: 3.75  },
  'claude-haiku-3-5':   { input: 0.80, output: 4,  cacheRead: 0.08,  cacheWrite: 1.0   },
};

// Fallback pricing if we don't recognize the model
const DEFAULT_PRICING: ModelPricing = { input: 3, output: 15, cacheRead: 0.30, cacheWrite: 3.75 };

function getPricing(model: string): ModelPricing {
  // Try exact match first, then prefix match
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key)) return pricing;
  }
  return DEFAULT_PRICING;
}

/**
 * Estimate cost for a model from its token breakdown.
 */
function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheCreationTokens: number,
): number {
  const p = getPricing(model);
  return (
    (inputTokens / 1_000_000) * p.input +
    (outputTokens / 1_000_000) * p.output +
    (cacheReadTokens / 1_000_000) * p.cacheRead +
    (cacheCreationTokens / 1_000_000) * p.cacheWrite
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function dirExists(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Read and parse stats-cache.json into UsageEntry[].
 *
 * Since the cache only stores output tokens per day, we proportionally
 * distribute aggregate input tokens, cache tokens, and cost across days
 * based on each day's share of total output tokens.
 */
async function readStatsCache(): Promise<UsageEntry[]> {
  const raw = await fs.readFile(STATS_CACHE, 'utf-8');
  const cache: StatsCache = JSON.parse(raw);

  const dailyTokens = cache.dailyModelTokens;
  if (!dailyTokens || dailyTokens.length === 0) return [];

  // Compute aggregate totals across all models
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheRead = 0;
  let totalCacheCreation = 0;
  let totalCost = 0;
  let hasRealCost = false;

  if (cache.modelUsage) {
    for (const [model, usage] of Object.entries(cache.modelUsage)) {
      totalInputTokens += usage.inputTokens || 0;
      totalOutputTokens += usage.outputTokens || 0;
      totalCacheRead += usage.cacheReadInputTokens || 0;
      totalCacheCreation += usage.cacheCreationInputTokens || 0;

      // stats-cache.json often reports costUSD as 0 — estimate from tokens
      if (usage.costUSD > 0) {
        totalCost += usage.costUSD;
        hasRealCost = true;
      } else {
        totalCost += estimateCost(
          model,
          usage.inputTokens || 0,
          usage.outputTokens || 0,
          usage.cacheReadInputTokens || 0,
          usage.cacheCreationInputTokens || 0,
        );
      }
    }
  }

  // Sum of all daily output tokens (for proportional distribution)
  const dailyOutputSum = dailyTokens.reduce((sum, day) => {
    return sum + Object.values(day.tokensByModel).reduce((s, t) => s + t, 0);
  }, 0);

  const entries: UsageEntry[] = [];

  for (const day of dailyTokens) {
    const dayOutputTokens = Object.values(day.tokensByModel).reduce(
      (s, t) => s + t,
      0,
    );
    if (dayOutputTokens === 0) continue;

    // Proportional share of this day's output vs total
    const share = dailyOutputSum > 0 ? dayOutputTokens / dailyOutputSum : 0;

    // Models used on this day
    const models = Object.keys(day.tokensByModel).filter(
      (m) => day.tokensByModel[m] > 0,
    );

    entries.push({
      date: day.date,
      provider: 'claude',
      output_tokens: dayOutputTokens,
      input_tokens: Math.round(totalInputTokens * share),
      cache_read_tokens: Math.round(totalCacheRead * share),
      cache_creation_tokens: Math.round(totalCacheCreation * share),
      cost_usd: Number((totalCost * share).toFixed(4)),
      models,
      cost_source: hasRealCost ? 'real' : 'estimated',
    });
  }

  return entries;
}

// ── Exported adapter ────────────────────────────────────────────────────

export const claudeAdapter: Adapter = {
  name: 'claude',
  displayName: 'Claude',

  async detect(): Promise<boolean> {
    // Primary check: stats-cache.json exists
    if (await fileExists(STATS_CACHE)) return true;
    // Fallback: the .claude directory itself exists (user has Claude installed)
    if (await dirExists(CLAUDE_DIR)) return true;
    return false;
  },

  async read(): Promise<UsageEntry[]> {
    try {
      return await readStatsCache();
    } catch {
      // stats-cache.json missing or unparseable
      return [];
    }
  },
};
