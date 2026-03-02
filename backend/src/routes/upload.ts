import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase/service.js';
import { requireAuth } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { detectImageType, mimeToExtension } from '../lib/validation/sanitize.js';
import { env } from '../env.js';

const upload = new Hono();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = 'post-images';

// ─── POST / ────────────────────────────────────────────────────────────
// Upload an image to Supabase Storage. Returns the public URL.
upload.post('/', requireAuth, async (c) => {
  const rateLimited = checkRateLimit(c, 'upload');
  if (rateLimited) return rateLimited;

  const userId = c.get('userId');

  const formData = await c.req.formData().catch(() => null);
  if (!formData) {
    return c.json({ error: 'Invalid form data' }, 400);
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }, 400);
  }

  // Read file bytes and validate magic bytes
  const buffer = new Uint8Array(await file.arrayBuffer());
  const detectedMime = detectImageType(buffer);

  if (!detectedMime) {
    return c.json({ error: 'Invalid image type. Supported: JPEG, PNG, WebP, GIF' }, 400);
  }

  const ext = mimeToExtension(detectedMime);
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadErr } = await serviceClient.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: detectedMime,
      upsert: false,
    });

  if (uploadErr) {
    console.error('[upload] storage error:', uploadErr.message);
    return c.json({ error: 'Failed to upload image' }, 500);
  }

  // Get public URL
  const { data: urlData } = serviceClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return c.json({
    url: urlData.publicUrl,
    path: filePath,
    mime: detectedMime,
    size: file.size,
  });
});

export default upload;
