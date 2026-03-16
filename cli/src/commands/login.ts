/**
 * `awarts login` -- Device-auth flow.
 *
 * 1. POST /api/auth/cli/init  --> receive code + verify URL
 * 2. Show the code in the terminal and attempt to open the browser
 * 3. Poll  POST /api/auth/cli/poll  every 2 s until verified / expired
 * 4. Store the JWT in ~/.awarts/auth.json
 * 5. Run an immediate sync so the user sees data right away
 * 6. Start the background daemon for continuous sync
 */

import chalk from 'chalk';
import open from 'open';
import { postUnauthenticated } from '../lib/api.js';
import { saveAuth, loadAuth, clearAuth } from '../lib/auth-store.js';
import * as out from '../lib/output.js';
import type { InitResponse, PollResponse } from '../types.js';
import { readPid, isProcessRunning, killProcess, removePid, DEFAULT_INTERVAL_MS, spawnDaemon } from '../lib/daemon.js';
import { syncCommand } from './sync.js';

const POLL_INTERVAL_MS = 2_000;
const MAX_POLLS = 300; // 10-minute timeout at 2 s intervals

/** Stop the running daemon (if any). Silent on failure. */
async function stopExistingDaemon(): Promise<void> {
  const pid = await readPid();
  if (pid && isProcessRunning(pid)) {
    killProcess(pid);
    await removePid();
  } else if (pid) {
    await removePid(); // stale PID
  }
}

export async function loginCommand(): Promise<void> {
  out.banner();

  // Check if already logged in
  const existing = await loadAuth();
  if (existing) {
    out.info('You are already logged in.');
    out.kv('User ID', existing.user_id);
    out.kv('Saved at', existing.saved_at);
    console.log();
    out.dim('To switch accounts:  awarts login --force');
    out.dim('To log out:          awarts logout');
    console.log();
    return;
  }

  await startDeviceAuth();
}

export async function loginForceCommand(): Promise<void> {
  out.banner();

  // Stop any running daemon first — it holds the old account's token
  const pid = await readPid();
  if (pid && isProcessRunning(pid)) {
    out.dim('Stopping existing daemon...');
    await stopExistingDaemon();
  }

  await clearAuth();
  await startDeviceAuth();
}

async function startDeviceAuth(): Promise<void> {
  // ── Step 1: Init ──────────────────────────────────────────────────────
  const spin = out.spinner('Starting device authentication...');
  spin.start();

  let initData: InitResponse;
  try {
    const res = await postUnauthenticated<InitResponse>('/api/auth/cli/init');
    if (!res.ok) {
      spin.fail('Failed to start authentication.');
      out.error(`Server responded with status ${res.status}`);
      return;
    }
    initData = res.data;
    spin.stop();
  } catch (err) {
    spin.fail('Could not reach the AWARTS server.');
    out.error(err instanceof Error ? err.message : String(err));
    out.dim('Is the backend running? Check AWARTS_API_URL or ~/.awarts/config.json');
    return;
  }

  // ── Step 2: Show code & open browser ──────────────────────────────────
  const FRONTEND_URL = process.env.AWARTS_FRONTEND_URL ?? 'https://awarts.vercel.app';
  const verifyUrl = `${FRONTEND_URL}/cli/verify?code=${initData.code}`;

  console.log();
  console.log(
    `  ${chalk.bold('Your verification code:')}  ${chalk.bgWhite.black.bold(` ${initData.code} `)}`,
  );
  console.log();
  out.info(`Open this URL to verify:  ${chalk.cyan.underline(verifyUrl)}`);
  console.log();

  // Try to open the browser automatically
  try {
    await open(verifyUrl);
    out.dim('Browser opened automatically. Waiting for verification...');
  } catch {
    out.dim('Could not open browser. Please visit the URL above manually.');
  }

  console.log();

  // ── Step 3: Poll ──────────────────────────────────────────────────────
  const pollSpin = out.spinner('Waiting for verification...');
  pollSpin.start();

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const res = await postUnauthenticated<PollResponse>('/api/auth/cli/poll', {
        device_token: initData.device_token,
      });

      if (!res.ok) {
        pollSpin.fail('Poll request failed.');
        out.error(`Status ${res.status}`);
        return;
      }

      const { status, token, user_id } = res.data;

      if (status === 'verified' && token && user_id) {
        // ── Step 4: Store token ─────────────────────────────────────────
        // Stop any existing daemon before saving new auth (it reads from the same file)
        await stopExistingDaemon();

        await saveAuth({
          token,
          user_id,
          saved_at: new Date().toISOString(),
        });

        pollSpin.succeed(chalk.green('Authenticated successfully!'));
        console.log();
        out.kv('User ID', user_id);
        out.success('Token saved to ~/.awarts/auth.json');
        console.log();

        // ── Step 5: Immediate sync ──────────────────────────────────────
        try {
          await syncCommand();
        } catch {
          out.dim('Initial sync skipped — you can run  awarts sync  manually.');
        }

        // ── Step 6: Start fresh daemon ──────────────────────────────────
        try {
          const pid = await spawnDaemon(DEFAULT_INTERVAL_MS);
          out.success(`Auto-sync daemon started (PID ${pid}, every 5 min)`);
          out.dim('Your usage data will sync automatically in the background.');
          out.dim('Manage with:  awarts daemon status | stop | logs');
        } catch {
          out.dim('Run  awarts daemon start  to enable auto-sync.');
        }
        console.log();
        return;
      }

      if (status === 'expired') {
        pollSpin.fail('Verification code expired.');
        out.error('Please run  awarts login  again to get a new code.');
        return;
      }

      // status === 'pending' -- keep polling
      pollSpin.text = `Waiting for verification... (${Math.floor((attempt + 1) * POLL_INTERVAL_MS / 1000)}s)`;
    } catch {
      // Network hiccup -- retry silently.
    }
  }

  pollSpin.fail('Timed out waiting for verification.');
  out.error('Please try  awarts login  again.');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
