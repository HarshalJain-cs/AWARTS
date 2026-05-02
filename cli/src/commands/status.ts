/**
 * `awarts status` -- Show current auth status and detected providers.
 */

import chalk from 'chalk';
import { loadAuth } from '../lib/auth-store.js';
import { getBaseUrl } from '../lib/api.js';
import { detectAll } from '../lib/detect.js';
import * as out from '../lib/output.js';

export async function statusCommand(): Promise<void> {
  out.banner();

  // ── Authentication ────────────────────────────────────────────────────
  console.log(`  ${chalk.bold.underline('Authentication')}`);
  console.log();

  const auth = await loadAuth();
  if (auth) {
    out.success('Logged in');
    out.kv('User ID', auth.user_id);
    out.kv('Saved at', auth.saved_at);
  } else {
    out.warn('Not logged in');
    out.dim('Run  awarts login  to authenticate.');
  }

  console.log();

  // ── API endpoint ──────────────────────────────────────────────────────
  console.log(`  ${chalk.bold.underline('Configuration')}`);
  console.log();

  const baseUrl = await getBaseUrl();
  out.kv('API URL', baseUrl);

  if (process.env.AWARTS_API_URL) {
    out.dim('(set via AWARTS_API_URL env var)');
  }

  console.log();

  // ── Provider detection ────────────────────────────────────────────────
  console.log(`  ${chalk.bold.underline('Providers')}`);
  console.log();

  const results = await detectAll();
  let anyDetected = false;

  for (const { adapter, detected } of results) {
    const label = out.providerLabel(adapter.name);
    if (detected) {
      console.log(`  ${chalk.green('+')} ${label}  ${chalk.dim('detected')}`);
      anyDetected = true;
    } else {
      console.log(`  ${chalk.dim('-')} ${label}  ${chalk.dim('not found')}`);
    }
  }

  if (!anyDetected) {
    console.log();
    out.dim('No AI coding tools detected on this machine.');
    out.dim('Usage data directories are looked up in your home folder.');
  }

  console.log();

  // ── Quick usage read for detected providers ───────────────────────────
  if (anyDetected) {
    console.log(`  ${chalk.bold.underline('Local Usage Data')}`);
    console.log();

    for (const { adapter, detected } of results) {
      if (!detected) continue;
      try {
        const entries = await adapter.read();
        if (entries.length > 0) {
          const totalCost = entries.reduce((s, e) => s + e.cost_usd, 0);
          const totalTokens = entries.reduce((s, e) => s + e.input_tokens + e.output_tokens, 0);
          const dates = entries.map((e) => e.date).sort();
          const oldest = dates[0];
          const newest = dates[dates.length - 1];

          console.log(
            `  ${out.providerLabel(adapter.name)}  ` +
              `${chalk.bold(String(entries.length))} entries  ` +
              `${chalk.yellow(out.usd(totalCost))}  ` +
              `${chalk.cyan(out.tokens(totalTokens) + ' tokens')}  ` +
              `${chalk.dim(`${oldest} - ${newest}`)}`,
          );
        } else {
          console.log(`  ${out.providerLabel(adapter.name)}  ${chalk.dim('no usage data')}`);
        }
      } catch {
        console.log(`  ${out.providerLabel(adapter.name)}  ${chalk.red('error reading data')}`);
      }
    }

    console.log();
  }
}
