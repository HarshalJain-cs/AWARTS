/**
 * Daemon process management -- start, stop, status, log reading.
 *
 * The daemon runs as a detached child process that periodically calls
 * syncCommand(). It writes its PID to ~/.awarts/daemon.pid and logs
 * to ~/.awarts/daemon.log.
 *
 * Works cross-platform: Windows 11, macOS, Linux.
 */

import fs from 'node:fs/promises';
import { openSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const AWARTS_DIR = path.join(os.homedir(), '.awarts');
export const PID_FILE = path.join(AWARTS_DIR, 'daemon.pid');
export const LOG_FILE = path.join(AWARTS_DIR, 'daemon.log');
export const DEFAULT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function ensureDir(): Promise<void> {
  await fs.mkdir(AWARTS_DIR, { recursive: true });
}

/** Read the stored PID, or null if no PID file exists. */
export async function readPid(): Promise<number | null> {
  try {
    const raw = await fs.readFile(PID_FILE, 'utf-8');
    const pid = parseInt(raw.trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/** Write a PID to the PID file. */
export async function writePid(pid: number): Promise<void> {
  await ensureDir();
  await fs.writeFile(PID_FILE, String(pid), 'utf-8');
}

/** Remove the PID file. */
export async function removePid(): Promise<void> {
  try {
    await fs.unlink(PID_FILE);
  } catch {
    // Already gone
  }
}

/**
 * Check if a process with the given PID is still running.
 * Uses signal 0 -- doesn't kill, just checks existence.
 */
export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Kill a process by PID. Returns true if successfully signalled. */
export function killProcess(pid: number): boolean {
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

/** Append a timestamped line to the daemon log. */
export async function appendLog(message: string): Promise<void> {
  await ensureDir();
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  await fs.appendFile(LOG_FILE, line, 'utf-8');
}

/** Read the last N lines of the daemon log. */
export async function readLogTail(lines: number = 50): Promise<string> {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8');
    const allLines = content.split('\n').filter(Boolean);
    return allLines.slice(-lines).join('\n');
  } catch {
    return '(no log file found)';
  }
}

/**
 * Spawn the daemon as a detached background process.
 *
 * Re-invokes the awarts CLI with a hidden `daemon __run` command
 * containing the polling loop. Uses `detached: true` + `unref()`
 * so the parent can exit immediately.
 */
export async function spawnDaemon(intervalMs: number): Promise<number> {
  await ensureDir();

  // The script being run (dist/index.js or src/index.ts)
  const cliScript = process.argv[1];

  // Open the log file for stdout/stderr redirection
  const logFd = openSync(LOG_FILE, 'a');

  const child = spawn(
    process.execPath,
    [cliScript, 'daemon', '__run', '--interval', String(intervalMs)],
    {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env: { ...process.env },
    },
  );

  child.unref();

  const pid = child.pid;
  if (!pid) {
    throw new Error('Failed to spawn daemon process');
  }

  await writePid(pid);
  return pid;
}
