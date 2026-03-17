/**
 * Persistent auth-token storage with encryption at rest.
 *
 * Reads and writes the CLI JWT to  ~/.awarts/auth.json  so subsequent
 * commands can authenticate without re-running the device-auth flow.
 * Tokens are encrypted using AES-256-GCM with a machine-derived key.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export interface AuthData {
  token: string;
  user_id: string;
  saved_at: string;
}

interface EncryptedAuthFile {
  version: 2;
  iv: string;       // hex
  tag: string;       // hex
  ciphertext: string; // hex
}

const AWARTS_DIR = path.join(os.homedir(), '.awarts');
const AUTH_FILE = path.join(AWARTS_DIR, 'auth.json');

/**
 * Derive a deterministic encryption key from machine identity.
 * Not meant to resist targeted attacks (the key material is local),
 * but prevents plain-text credential leaks from backups/screenshots/logs.
 */
function deriveKey(): Buffer {
  const material = `awarts-cli:${os.hostname()}:${os.userInfo().username}`;
  return crypto.createHash('sha256').update(material).digest();
}

function encrypt(plaintext: string): EncryptedAuthFile {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    version: 2,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: encrypted.toString('hex'),
  };
}

function decrypt(file: EncryptedAuthFile): string {
  const key = deriveKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(file.iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(file.tag, 'hex'));
  return decipher.update(file.ciphertext, 'hex', 'utf8') + decipher.final('utf8');
}

/**
 * Ensure the ~/.awarts directory exists.
 */
async function ensureDir(): Promise<void> {
  await fs.mkdir(AWARTS_DIR, { recursive: true, mode: 0o700 });
}

/**
 * Save auth credentials to disk (encrypted).
 */
export async function saveAuth(data: AuthData): Promise<void> {
  await ensureDir();
  const encrypted = encrypt(JSON.stringify(data));
  await fs.writeFile(AUTH_FILE, JSON.stringify(encrypted, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

/**
 * Load previously-saved auth credentials.
 * Returns `null` when no credentials are stored or the file is corrupt.
 * Transparently migrates plaintext v1 files to encrypted v2.
 */
export async function loadAuth(): Promise<AuthData | null> {
  try {
    const raw = await fs.readFile(AUTH_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // v2 encrypted format
    if (parsed.version === 2 && parsed.ciphertext) {
      const decrypted = JSON.parse(decrypt(parsed as EncryptedAuthFile));
      if (typeof decrypted.token === 'string' && typeof decrypted.user_id === 'string') {
        return decrypted as AuthData;
      }
      return null;
    }

    // v1 plaintext — migrate to encrypted
    if (typeof parsed.token === 'string' && typeof parsed.user_id === 'string') {
      const data = parsed as AuthData;
      await saveAuth(data); // re-save encrypted
      return data;
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
