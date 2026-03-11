/**
 * `awarts sync` -- Auto-detect all installed providers and push everything.
 *
 * This is the "one command to rule them all" -- it detects which AI tools
 * are installed, reads their usage data, and submits it to the AWARTS API
 * in a single pass. Equivalent to  `awarts push`  with no --provider flag
 * but with additional detection feedback.
 */

import chalk from 'chalk';
import { post } from '../lib/api.js';
import { loadAuth } from '../lib/auth-store.js';
import { detectAll } from '../lib/detect.js';
import { hashEntries } from '../lib/hash.js';
import * as out from '../lib/output.js';
import type { UsageEntry, SubmitResponse } from '../types.js';
import { readPid, isProcessRunning, DEFAULT_INTERVAL_MS } from '../lib/daemon.js';
import { spawnDaemon } from '../lib/daemon.js';

export async function syncCommand(): Promise<void> {
  out.banner();

  // ── Auth check ────────────────────────────────────────────────────────
  const auth = await loadAuth();
  if (!auth) {
    out.error('Not logged in. Run  awarts login  first.');
    return;
  }

  // ── Detect providers ──────────────────────────────────────────────────
  const detectSpin = out.spinner('Detecting installed providers...');
  detectSpin.start();

  const results = await detectAll();
  const detected = results.filter((r) => r.detected);

  if (detected.length === 0) {
    detectSpin.warn('No AI coding tools detected.');
    console.log();
    out.dim('Looked for: Claude, Codex, Gemini, Antigravity');
    out.dim('Make sure you have used one of these tools on this machine.');
    console.log();
    return;
  }

  const names = detected.map((r) => out.providerLabel(r.adapter.name)).join(', ');
  detectSpin.succeed(`Detected: ${names}`);
  console.log();

  // ── Read from all detected adapters ──────────────────────────────────
  const allEntries: UsageEntry[] = [];

  for (const { adapter } of detected) {
    const spin = out.spinner(`Reading ${adapter.displayName} data...`);
    spin.start();

    try {
      const entries = await adapter.read();
      if (entries.length === 0) {
        spin.info(chalk.dim(`${adapter.displayName} -- no usage data found (use manual import on awarts.com or add usage files)`));
      } else {
        allEntries.push(...entries);
        const totalCost = entries.reduce((s, e) => s + e.cost_usd, 0);
        spin.succeed(
          `${out.providerLabel(adapter.name)}  ` +
            `${chalk.bold(String(entries.length))} entries  ` +
            `${chalk.yellow(out.usd(totalCost))}`,
        );
      }
    } catch (err) {
      spin.fail(`${adapter.displayName} -- error reading data`);
      out.error(err instanceof Error ? err.message : String(err));
    }
  }

  console.log();

  if (allEntries.length === 0) {
    out.warn('No usage data found across any provider.');
    console.log();
    return;
  }

  // ── Summary ──────────────────────────────────────────────────────────
  const totalCost = allEntries.reduce((s, e) => s + e.cost_usd, 0);
  const totalTokens = allEntries.reduce((s, e) => s + e.input_tokens + e.output_tokens, 0);
  const uniqueDates = new Set(allEntries.map((e) => e.date));

  out.divider();
  out.kv('Total entries', allEntries.length);
  out.kv('Unique days', uniqueDates.size);
  out.kv('Total cost', out.usd(totalCost));
  out.kv('Total tokens', out.tokens(totalTokens));
  out.divider();
  console.log();

  // ── Submit ───────────────────────────────────────────────────────────
  const hash = hashEntries(allEntries);
  const submitSpin = out.spinner('Syncing with AWARTS...');
  submitSpin.start();

  try {
    const res = await post<SubmitResponse>('/api/usage/submit', {
      entries: allEntries,
      source: 'cli',
      hash,
    });

    if (!res.ok) {
      submitSpin.fail('Sync failed.');
      if (res.status === 401) {
        out.error('Authentication expired. Run  awarts login  to re-authenticate.');
      } else {
        out.error(`Server returned status ${res.status}`);
        const errorData = res.data as unknown as Record<string, unknown>;
        if (errorData?.error) out.error(String(errorData.error));
      }
      return;
    }

    const { processed, posts_created, errors } = res.data;

    if (errors && errors.length > 0) {
      submitSpin.warn(chalk.yellow(`Synced with ${errors.length} error(s).`));
      for (const e of errors) {
        out.error(`  ${e.date} / ${e.provider}: ${e.error}`);
      }
    } else {
      submitSpin.succeed(chalk.green('Sync complete!'));
    }

    console.log();
    out.kv('Entries processed', processed);
    out.kv('Posts created', posts_created);
    console.log();
    out.success('Your usage data is now live on AWARTS.');
    console.log();

    // ── Auto-start daemon if not already running ────────────────────────
    try {
      const existingPid = await readPid();
      const isRunning = existingPid ? isProcessRunning(existingPid) : false;
      if (!isRunning) {
        const pid = await spawnDaemon(DEFAULT_INTERVAL_MS);
        out.dim(`Auto-sync daemon started (PID ${pid}, every 5 min)`);
        out.dim('Manage with:  awarts daemon status | stop | logs');
        console.log();
      }
    } catch {
      // Non-critical -- don't fail the sync over daemon issues
    }
  } catch (err) {
    submitSpin.fail('Could not reach the AWARTS server.');
    out.error(err instanceof Error ? err.message : String(err));
    out.dim('Is the backend running? Check AWARTS_API_URL or ~/.awarts/config.json');
  }
}
