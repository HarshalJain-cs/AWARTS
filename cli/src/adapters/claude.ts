/**
 * Claude adapter -- reads local usage data from Claude Code / Claude Desktop.
 *
 * Expected location:  ~/.claude/usage/
 * Each file is named YYYY-MM-DD.json and contains a JSON object with
 * cost, token counts, and model info for that day's sessions.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Adapter, UsageEntry } from '../types.js';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const USAGE_DIR = path.join(CLAUDE_DIR, 'usage');

// Alternate location used by some Claude Code installations
const ALT_USAGE_DIR = path.join(CLAUDE_DIR, 'projects');

interface ClaudeUsageFile {
  date?: string;
  totalCost?: number;
  cost_usd?: number;
  totalInputTokens?: number;
  input_tokens?: number;
  totalOutputTokens?: number;
  output_tokens?: number;
  cacheCreationTokens?: number;
  cache_creation_tokens?: number;
  cacheReadTokens?: number;
  cache_read_tokens?: number;
  models?: string[];
  model?: string;
  [key: string]: unknown;
}

/**
 * Attempt to parse a date from a filename like "2025-06-15.json".
 */
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

async function readUsageDir(dir: string): Promise<UsageEntry[]> {
  const entries: UsageEntry[] = [];

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
      const data: ClaudeUsageFile = JSON.parse(raw);

      const date = data.date ?? dateFromFilename(file);
      if (!date) continue;

      const costUsd = data.cost_usd ?? data.totalCost ?? 0;
      const inputTokens = data.input_tokens ?? data.totalInputTokens ?? 0;
      const outputTokens = data.output_tokens ?? data.totalOutputTokens ?? 0;
      const cacheCreation = data.cache_creation_tokens ?? data.cacheCreationTokens ?? 0;
      const cacheRead = data.cache_read_tokens ?? data.cacheReadTokens ?? 0;

      const models: string[] = data.models
        ? data.models
        : data.model
          ? [data.model]
          : [];

      entries.push({
        date,
        provider: 'claude',
        cost_usd: Number(costUsd) || 0,
        input_tokens: Number(inputTokens) || 0,
        output_tokens: Number(outputTokens) || 0,
        cache_creation_tokens: Number(cacheCreation) || 0,
        cache_read_tokens: Number(cacheRead) || 0,
        models,
      });
    } catch {
      // Skip unparseable files silently.
    }
  }

  return entries;
}

export const claudeAdapter: Adapter = {
  name: 'claude',
  displayName: 'Claude',

  async detect(): Promise<boolean> {
    // Detect if the Claude config directory or usage directory exists
    if (await dirExists(USAGE_DIR)) return true;
    if (await dirExists(CLAUDE_DIR)) return true;
    if (await dirExists(ALT_USAGE_DIR)) return true;
    return false;
  },

  async read(): Promise<UsageEntry[]> {
    const entries: UsageEntry[] = [];

    // Read from primary usage dir
    entries.push(...(await readUsageDir(USAGE_DIR)));

    // If no entries found, try alternate location
    if (entries.length === 0) {
      entries.push(...(await readUsageDir(ALT_USAGE_DIR)));
    }

    return entries;
  },
};
