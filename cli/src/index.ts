#!/usr/bin/env node

/**
 * AWARTS CLI -- track your AI coding spend across providers.
 *
 * Usage:
 *   npx awarts login            Authenticate with your AWARTS account
 *   npx awarts push             Push local usage data to AWARTS
 *   npx awarts sync             Auto-detect providers and push everything
 *   npx awarts status           Show auth status and detected providers
 *   npx awarts logout           Clear stored credentials
 */

import { Command } from 'commander';
import { loginCommand, loginForceCommand } from './commands/login.js';
import { pushCommand } from './commands/push.js';
import { statusCommand } from './commands/status.js';
import { syncCommand } from './commands/sync.js';
import { clearAuth } from './lib/auth-store.js';
import * as out from './lib/output.js';

const program = new Command();

program
  .name('awarts')
  .description('Track your AI coding spend across Claude, Codex, Gemini & Antigravity')
  .version('0.1.0');

// ─── login ──────────────────────────────────────────────────────────────
program
  .command('login')
  .description('Authenticate with your AWARTS account via device auth')
  .option('--force', 'Re-authenticate even if already logged in')
  .action(async (opts: { force?: boolean }) => {
    try {
      if (opts.force) {
        await loginForceCommand();
      } else {
        await loginCommand();
      }
    } catch (err) {
      out.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ─── push ───────────────────────────────────────────────────────────────
program
  .command('push')
  .description('Read local usage data and submit to AWARTS')
  .option('-p, --provider <name>', 'Only push data from a specific provider (claude, codex, gemini, antigravity)')
  .option('-n, --dry-run', 'Show what would be pushed without submitting')
  .action(async (opts: { provider?: string; dryRun?: boolean }) => {
    try {
      await pushCommand(opts);
    } catch (err) {
      out.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ─── sync ───────────────────────────────────────────────────────────────
program
  .command('sync')
  .description('Auto-detect all providers and push usage data')
  .action(async () => {
    try {
      await syncCommand();
    } catch (err) {
      out.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ─── status ─────────────────────────────────────────────────────────────
program
  .command('status')
  .description('Show auth status, configuration, and detected providers')
  .action(async () => {
    try {
      await statusCommand();
    } catch (err) {
      out.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ─── logout ─────────────────────────────────────────────────────────────
program
  .command('logout')
  .description('Clear stored credentials')
  .action(async () => {
    try {
      out.banner();
      await clearAuth();
      out.success('Logged out. Credentials removed from ~/.awarts/auth.json');
      console.log();
    } catch (err) {
      out.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

// ─── Parse & run ────────────────────────────────────────────────────────
program.parseAsync(process.argv).catch((err) => {
  out.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
