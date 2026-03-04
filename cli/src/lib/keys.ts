/**
 * API key management for provider billing APIs.
 * Keys stored locally at ~/.awarts/keys.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const KEYS_PATH = path.join(os.homedir(), '.awarts', 'keys.json');

export type ProviderKeyName = 'openai' | 'google' | 'antigravity';

interface KeyStore {
  openai?: string;
  google?: string;
  antigravity?: string;
}

async function ensureDir(): Promise<void> {
  const dir = path.dirname(KEYS_PATH);
  await fs.mkdir(dir, { recursive: true });
}

export async function loadKeys(): Promise<KeyStore> {
  try {
    const raw = await fs.readFile(KEYS_PATH, 'utf-8');
    return JSON.parse(raw) as KeyStore;
  } catch {
    return {};
  }
}

export async function saveKeys(keys: KeyStore): Promise<void> {
  await ensureDir();
  await fs.writeFile(KEYS_PATH, JSON.stringify(keys, null, 2), 'utf-8');
  // Set restrictive permissions (owner-only read/write)
  try {
    await fs.chmod(KEYS_PATH, 0o600);
  } catch {
    // chmod may fail on Windows — acceptable
  }
}

export async function setKey(provider: ProviderKeyName, key: string): Promise<void> {
  const keys = await loadKeys();
  keys[provider] = key;
  await saveKeys(keys);
}

export async function getKey(provider: ProviderKeyName): Promise<string | undefined> {
  const keys = await loadKeys();
  return keys[provider];
}

export async function removeKey(provider: ProviderKeyName): Promise<boolean> {
  const keys = await loadKeys();
  if (!keys[provider]) return false;
  delete keys[provider];
  await saveKeys(keys);
  return true;
}

export async function listKeys(): Promise<Array<{ provider: ProviderKeyName; masked: string }>> {
  const keys = await loadKeys();
  const result: Array<{ provider: ProviderKeyName; masked: string }> = [];
  for (const [provider, key] of Object.entries(keys)) {
    if (key) {
      const masked = key.length > 8
        ? key.slice(0, 4) + '...' + key.slice(-4)
        : '****';
      result.push({ provider: provider as ProviderKeyName, masked });
    }
  }
  return result;
}
