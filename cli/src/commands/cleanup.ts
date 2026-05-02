/**
 * `awarts cleanup` -- Remove old/invalid usage data from the AWARTS platform.
 *
 * Deletes usage entries with obviously wrong dates (before 2020) that were
 * created by adapter bugs, and their associated posts.
 */

import chalk from 'chalk';
import { post } from '../lib/api.js';
import { loadAuth } from '../lib/auth-store.js';
import * as out from '../lib/output.js';

interface CleanupResponse {
  deleted: number;
  posts_deleted: number;
}

export async function cleanupCommand(opts: {
  beforeDate?: string;
  dates?: string[];
}): Promise<void> {
  out.banner();

  const auth = await loadAuth();
  if (!auth) {
    out.error('Not logged in. Run  awarts login  first.');
    return;
  }

  const spin = out.spinner('Cleaning up invalid usage data...');
  spin.start();

  try {
    const body: Record<string, unknown> = {};
    if (opts.beforeDate) body.before_date = opts.beforeDate;
    if (opts.dates) body.dates = opts.dates;

    const res = await post<CleanupResponse>('/api/usage/cleanup', body);

    if (!res.ok) {
      spin.fail('Cleanup failed.');
      if (res.status === 401) {
        out.error('Authentication expired. Run  awarts login  to re-authenticate.');
      } else {
        out.error(`Server returned status ${res.status}`);
      }
      return;
    }

    const { deleted, posts_deleted } = res.data;

    if (deleted === 0 && posts_deleted === 0) {
      spin.info('No invalid data found — nothing to clean up.');
    } else {
      spin.succeed(chalk.green('Cleanup complete!'));
      console.log();
      out.kv('Usage entries deleted', deleted);
      out.kv('Posts deleted', posts_deleted);
    }
    console.log();
  } catch (err) {
    spin.fail('Could not reach the AWARTS server.');
    out.error(err instanceof Error ? err.message : String(err));
  }
}
