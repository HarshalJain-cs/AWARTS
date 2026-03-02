/**
 * HTTP client for the AWARTS backend API.
 *
 * Reads the JWT from the local auth store and injects it into every request.
 * The base URL defaults to http://localhost:3001 and can be overridden via
 * the AWARTS_API_URL env var or ~/.awarts/config.json.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { getToken } from './auth-store.js';

// ── Resolve the API base URL ────────────────────────────────────────────
const DEFAULT_API_URL = 'https://brilliant-corgi-819.convex.cloud';

async function readConfigUrl(): Promise<string | null> {
  try {
    const configPath = path.join(os.homedir(), '.awarts', 'config.json');
    const raw = await fs.readFile(configPath, 'utf-8');
    const cfg = JSON.parse(raw);
    if (typeof cfg.api_url === 'string' && cfg.api_url.length > 0) {
      return cfg.api_url;
    }
  } catch {
    // Config file missing or malformed -- fall through.
  }
  return null;
}

let _baseUrl: string | null = null;

export async function getBaseUrl(): Promise<string> {
  if (_baseUrl) return _baseUrl;

  // Priority: env var > config file > default
  if (process.env.AWARTS_API_URL) {
    _baseUrl = process.env.AWARTS_API_URL.replace(/\/+$/, '');
    return _baseUrl;
  }

  const fromConfig = await readConfigUrl();
  if (fromConfig) {
    _baseUrl = fromConfig.replace(/\/+$/, '');
    return _baseUrl;
  }

  _baseUrl = DEFAULT_API_URL;
  return _baseUrl;
}

// ── API response wrapper ────────────────────────────────────────────────
export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T;
}

// ── Core request helper ─────────────────────────────────────────────────
export async function apiRequest<T = unknown>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  const base = await getBaseUrl();
  const url = `${base}${endpoint}`;
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'awarts-cli/0.1.0',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T;

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

// ── Convenience wrappers ────────────────────────────────────────────────
export function get<T = unknown>(endpoint: string): Promise<ApiResult<T>> {
  return apiRequest<T>('GET', endpoint);
}

export function post<T = unknown>(endpoint: string, body?: unknown): Promise<ApiResult<T>> {
  return apiRequest<T>('POST', endpoint, body);
}

// ── Un-authenticated POST (for the device-auth init/poll flow) ──────────
export async function postUnauthenticated<T = unknown>(
  endpoint: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  const base = await getBaseUrl();
  const url = `${base}${endpoint}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'awarts-cli/0.1.0',
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T;

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}
