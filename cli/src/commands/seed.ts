/**
 * `awarts seed` -- Generate sample usage data for providers that have no data.
 *
 * Creates usage JSON files in the standard locations so `awarts sync` can
 * pick them up. Useful for new users who have Codex/Gemini/Antigravity
 * installed but haven't generated readable usage files yet.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import chalk from 'chalk';
import * as out from '../lib/output.js';

const HOME = os.homedir();
const IS_WIN = process.platform === 'win32';
const LOCALAPPDATA = process.env.LOCALAPPDATA ?? path.join(HOME, 'AppData', 'Local');

// Standard usage directories for each provider
const PROVIDER_USAGE_DIRS: Record<string, string> = {
  codex: IS_WIN
    ? path.join(LOCALAPPDATA, 'codex', 'usage')
    : path.join(HOME, '.codex', 'usage'),
  gemini: IS_WIN
    ? path.join(LOCALAPPDATA, 'gemini', 'usage')
    : path.join(HOME, '.gemini', 'usage'),
  antigravity: IS_WIN
    ? path.join(LOCALAPPDATA, 'antigravity', 'usage')
    : path.join(HOME, '.antigravity', 'usage'),
};

// Models to use in sample data
const SAMPLE_MODELS: Record<string, string[]> = {
  codex: ['gpt-4.1', 'gpt-4.1-mini', 'o4-mini'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  antigravity: ['antigravity-1.5'],
};

// Typical token ranges per provider (for realistic samples)
const TOKEN_RANGES: Record<string, { inputMin: number; inputMax: number; outputMin: number; outputMax: number }> = {
  codex: { inputMin: 8_000, inputMax: 45_000, outputMin: 2_000, outputMax: 18_000 },
  gemini: { inputMin: 5_000, inputMax: 35_000, outputMin: 1_500, outputMax: 12_000 },
  antigravity: { inputMin: 10_000, inputMax: 50_000, outputMin: 3_000, outputMax: 20_000 },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSampleEntries(provider: string, days: number) {
  const models = SAMPLE_MODELS[provider] ?? ['unknown'];
  const ranges = TOKEN_RANGES[provider] ?? { inputMin: 5000, inputMax: 30000, outputMin: 2000, outputMax: 15000 };
  const entries: Array<{ date: string; data: Record<string, unknown> }> = [];

  const now = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Skip some days randomly to look realistic
    if (i > 0 && Math.random() < 0.3) continue;

    const model = models[randomInt(0, models.length - 1)];
    const inputTokens = randomInt(ranges.inputMin, ranges.inputMax);
    const outputTokens = randomInt(ranges.outputMin, ranges.outputMax);

    entries.push({
      date: dateStr,
      data: {
        date: dateStr,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model,
        models: [model],
      },
    });
  }

  return entries;
}

async function dirExists(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function hasExistingData(dir: string): Promise<boolean> {
  if (!(await dirExists(dir))) return false;
  try {
    const files = await fs.readdir(dir);
    return files.some((f) => f.endsWith('.json'));
  } catch {
    return false;
  }
}

export async function seedCommand(opts: { provider?: string; days?: number; force?: boolean }): Promise<void> {
  out.banner();

  const days = opts.days ?? 7;
  const providers = opts.provider
    ? [opts.provider]
    : Object.keys(PROVIDER_USAGE_DIRS);

  let seeded = 0;

  for (const provider of providers) {
    const usageDir = PROVIDER_USAGE_DIRS[provider];
    if (!usageDir) {
      out.warn(`Unknown provider: ${provider}`);
      continue;
    }

    // Check if data already exists
    if (!opts.force && (await hasExistingData(usageDir))) {
      out.info(`${chalk.bold(provider)} already has usage data in ${chalk.dim(usageDir)}`);
      out.dim('  Use --force to overwrite existing data');
      continue;
    }

    const spin = out.spinner(`Generating ${provider} sample data...`);
    spin.start();

    try {
      // Create the usage directory
      await fs.mkdir(usageDir, { recursive: true });

      const entries = generateSampleEntries(provider, days);

      for (const entry of entries) {
        const filePath = path.join(usageDir, `${entry.date}.json`);
        await fs.writeFile(filePath, JSON.stringify(entry.data, null, 2), 'utf-8');
      }

      spin.succeed(
        `${out.providerLabel(provider)}  ${chalk.bold(String(entries.length))} sample files written to ${chalk.dim(usageDir)}`,
      );
      seeded++;
    } catch (err) {
      spin.fail(`Failed to seed ${provider}`);
      out.error(err instanceof Error ? err.message : String(err));
    }
  }

  console.log();

  if (seeded > 0) {
    out.success(`Sample data generated! Run ${chalk.cyan('awarts sync')} to push it to AWARTS.`);
    console.log();
    out.dim('Note: Seed data uses estimated costs based on token counts and model pricing.');
    out.dim('For real billing data, set up API keys: awarts keys set <provider> <key>');
  } else {
    out.info('No providers needed seeding. All providers already have data.');
    out.dim(`Use ${chalk.cyan('--force')} to regenerate sample data.`);
  }

  console.log();
}
