/**
 * Persistent auth-token storage.
 *
 * Reads and writes the CLI JWT to  ~/.awarts/auth.json  so subsequent
 * commands can authenticate without re-running the device-auth flow.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export interface AuthData {
  token: string;
  user_id: string;
  saved_at: string;
}

const AWARTS_DIR = path.join(os.homedir(), '.awarts');
const AUTH_FILE = path.join(AWARTS_DIR, 'auth.json');

/**
 * Ensure the ~/.awarts directory exists.
 */
async function ensureDir(): Promise<void> {
  await fs.mkdir(AWARTS_DIR, { recursive: true });
}

/**
 * Save auth credentials to disk.
 */
export async function saveAuth(data: AuthData): Promise<void> {
  await ensureDir();
  await fs.writeFile(AUTH_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Load previously-saved auth credentials.
 * Returns `null` when no credentials are stored or the file is corrupt.
 */
export async function loadAuth(): Promise<AuthData | null> {
  try {
    const raw = await fs.readFile(AUTH_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed.token === 'string' && typeof parsed.user_id === 'string') {
      return parsed as AuthData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Delete the stored credentials (logout).
 */
export async function clearAuth(): Promise<void> {
  try {
    await fs.unlink(AUTH_FILE);
  } catch {
    // Already gone -- nothing to do.
  }
}

/**
 * Convenience: read only the JWT token, or `null`.
 */
export async function getToken(): Promise<string | null> {
  const auth = await loadAuth();
  return auth?.token ?? null;
}
