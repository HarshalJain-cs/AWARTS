/**
 * Codex (OpenAI) adapter -- reads local usage data from OpenAI Codex CLI.
 *
 * Expected locations:
 *   ~/.codex/usage/         (Codex CLI)
 *   ~/.openai-codex/usage/  (alternate installation)
 *
 * Files are expected as YYYY-MM-DD.json with a similar schema to Claude.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { Adapter, UsageEntry } from '../types.js';

const HOME = os.homedir();

const CANDIDATE_DIRS = [
  path.join(HOME, '.codex', 'usage'),
  path.join(HOME, '.openai-codex', 'usage'),
  path.join(HOME, '.codex'),
];

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
  for (const dir of CANDIDATE_DIRS) {
    if (await dirExists(dir)) return dir;
  }
  return null;
}

export const codexAdapter: Adapter = {
  name: 'codex',
  displayName: 'Codex',

  async detect(): Promise<boolean> {
    return (await findUsageDir()) !== null;
  },

  async read(): Promise<UsageEntry[]> {
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
        const inputTokens = data.input_tokens ?? 0;
        const outputTokens = data.output_tokens ?? 0;

        const models: string[] = data.models
          ? data.models
          : data.model
            ? [data.model]
            : [];

        entries.push({
          date,
          provider: 'codex',
          cost_usd: Number(costUsd) || 0,
          input_tokens: Number(inputTokens) || 0,
          output_tokens: Number(outputTokens) || 0,
          cache_creation_tokens: Number(data.cache_creation_tokens ?? 0) || 0,
          cache_read_tokens: Number(data.cache_read_tokens ?? 0) || 0,
          models,
        });
      } catch {
        // Skip unparseable files silently.
      }
    }

    return entries;
  },
};
