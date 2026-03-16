/**
 * Gemini adapter -- reads local usage data from Gemini CLI.
 *
 * Primary: Local file reading from ~/.gemini/usage/ (YYYY-MM-DD.json)
 * Fallback: Session chat files from ~/.gemini/tmp/<user>/chats/session-*.json
 *           (Gemini CLI stores token counts per message in these files)
 *
 * Detection: Checks for Google API key, Gemini CLI config dirs, or
 * the `gemini` command being available in PATH.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import type { Adapter, UsageEntry } from '../types.js';
import { getKey } from '../lib/keys.js';

const HOME = os.homedir();
const IS_WIN = process.platform === 'win32';
const LOCALAPPDATA = process.env.LOCALAPPDATA ?? path.join(HOME, 'AppData', 'Local');

const LOCAL_DIRS = [
  path.join(HOME, '.gemini', 'usage'),
  path.join(HOME, '.config', 'gemini', 'usage'),
  ...(IS_WIN ? [
    path.join(LOCALAPPDATA, 'gemini', 'usage'),
  ] : []),
];

// Directories that indicate Gemini CLI is installed
const DETECT_DIRS = [
  path.join(HOME, '.gemini'),
  path.join(HOME, '.config', 'gemini'),
  ...(IS_WIN ? [
    path.join(LOCALAPPDATA, 'gemini'),
  ] : []),
];

// ── Gemini Pricing (per million tokens, USD) ────────────────────────────
// Updated: March 2026 — https://ai.google.dev/gemini-api/docs/pricing
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  // Latest production models
  'gemini-2.5-pro':          { input: 1.25,  output: 10.00 },
  'gemini-2.5-flash':        { input: 0.30,  output: 2.50 },
  'gemini-2.5-flash-lite':   { input: 0.10,  output: 0.40 },
  // Preview / newer models
  'gemini-3.1-pro':              { input: 2.00,  output: 12.00 },
  'gemini-3.1-flash-lite':       { input: 0.25,  output: 1.50 },
  'gemini-3-flash':              { input: 0.50,  output: 3.00 },
  'gemini-3-flash-preview':      { input: 0.50,  output: 3.00 },
  // Older models
  'gemini-2.0-flash':        { input: 0.10,  output: 0.40 },
  'gemini-2.0-flash-lite':   { input: 0.075, output: 0.30 },
  'gemini-1.5-pro':          { input: 1.25,  output: 5.00 },
  'gemini-1.5-flash':        { input: 0.075, output: 0.30 },
  'gemini-1.5-flash-8b':     { input: 0.0375, output: 0.15 },
};
const DEFAULT_PRICING = { input: 0.30, output: 2.50 }; // 2.5 Flash as default

function calculateCost(
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

function commandExists(cmd: string): boolean {
  try {
    execFileSync(IS_WIN ? 'where' : 'which', [cmd], { stdio: 'ignore' });
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
      const data: GeminiUsageFile = JSON.parse(raw);

      const date = data.date ?? dateFromFilename(file);
      if (!date) continue;

      const costUsd = data.cost_usd ?? data.total_cost ?? 0;
      const inputTokens = Number(data.input_tokens ?? 0) || 0;
      const outputTokens = Number(data.output_tokens ?? 0) || 0;
      const model = data.model ?? (data.models?.[0]);

      // Use real cost if provided; calculate from real token counts if not
      let finalCost = Number(costUsd) || 0;
      let costSource: 'real' | 'estimated' = finalCost > 0 ? 'real' : 'estimated';
      if (finalCost === 0 && (inputTokens > 0 || outputTokens > 0)) {
        finalCost = calculateCost(inputTokens, outputTokens, model);
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

// ── Session file fallback: read ~/.gemini/tmp/*/chats/session-*.json ────

interface GeminiSessionMessage {
  type: string;
  timestamp?: string;
  tokens?: {
    input?: number;
    output?: number;
    cached?: number;
    thoughts?: number;
    tool?: number;
    total?: number;
  };
  model?: string;
}

interface GeminiSessionFile {
  sessionId?: string;
  startTime?: string;
  messages?: GeminiSessionMessage[];
}

async function readSessionFiles(): Promise<UsageEntry[]> {
  // Gemini CLI stores sessions in ~/.gemini/tmp/<user>/chats/session-*.json
  const geminiDir = path.join(HOME, '.gemini', 'tmp');
  if (!(await dirExists(geminiDir))) return [];

  const entries: UsageEntry[] = [];

  try {
    // List user directories under tmp/
    const userDirs = await fs.readdir(geminiDir);

    for (const userDir of userDirs) {
      const chatsDir = path.join(geminiDir, userDir, 'chats');
      if (!(await dirExists(chatsDir))) continue;

      let files: string[];
      try {
        files = await fs.readdir(chatsDir);
      } catch { continue; }

      const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));

      // Group tokens by date across all sessions
      const dayMap = new Map<string, { input: number; output: number; cached: number; models: Set<string> }>();

      for (const file of sessionFiles) {
        try {
          const raw = await fs.readFile(path.join(chatsDir, file), 'utf-8');
          const session: GeminiSessionFile = JSON.parse(raw);

          // Extract date from startTime or filename
          let date: string | null = null;
          if (session.startTime) {
            date = session.startTime.split('T')[0];
          } else {
            // Filename: session-2026-03-16T06-04-de12821c.json
            const match = file.match(/session-(\d{4}-\d{2}-\d{2})/);
            if (match) date = match[1];
          }
          if (!date) continue;

          if (!dayMap.has(date)) dayMap.set(date, { input: 0, output: 0, cached: 0, models: new Set() });
          const day = dayMap.get(date)!;

          for (const msg of session.messages ?? []) {
            if (msg.type !== 'gemini' || !msg.tokens) continue;
            day.input += msg.tokens.input ?? 0;
            day.output += msg.tokens.output ?? 0;
            day.cached += msg.tokens.cached ?? 0;
            if (msg.model) day.models.add(msg.model);
          }
        } catch { /* skip unparseable */ }
      }

      for (const [date, { input, output, cached, models }] of dayMap) {
        if (input === 0 && output === 0) continue;
        const modelName = [...models][0];
        const cost = calculateCost(input, output, modelName);

        entries.push({
          date,
          provider: 'gemini',
          cost_usd: cost,
          input_tokens: input,
          output_tokens: output,
          cache_read_tokens: cached,
          models: [...models].length > 0 ? [...models] : ['gemini'],
          cost_source: 'estimated',
        });
      }
    }
  } catch {
    // tmp directory unreadable
  }

  return entries;
}

// ── Adapter export ──────────────────────────────────────────────────────

export const geminiAdapter: Adapter = {
  name: 'gemini',
  displayName: 'Gemini',

  async detect(): Promise<boolean> {
    // Detected if API key exists
    const apiKey = await getKey('google');
    if (apiKey) return true;
    // Or any known Gemini dir exists
    for (const dir of DETECT_DIRS) {
      if (await dirExists(dir)) return true;
    }
    // Or the gemini CLI command is available
    if (commandExists('gemini')) return true;
    return false;
  },

  async read(): Promise<UsageEntry[]> {
    // Try structured usage files first
    const localEntries = await readLocalFiles();
    if (localEntries.length > 0) return localEntries;

    // Fall back to session chat files (Gemini CLI's actual storage)
    return readSessionFiles();
  },
};
