import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as out from './output.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getLocalVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export async function checkForUpdates(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://registry.npmjs.org/awarts/latest', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return;

    const data = (await res.json()) as { version?: string };
    const latest = data.version;
    const current = getLocalVersion();

    if (latest && latest !== current) {
      out.info(`Update available: ${current} → ${latest}. Run: npm i -g awarts@latest`);
    }
  } catch {
    // Silent fail — don't block CLI usage
  }
}
