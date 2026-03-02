-- ─── CREATE post-images STORAGE BUCKET ──────────────────────────────────
-- Public bucket for user-uploaded coding session screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ─── POLICY 1: Anyone can read (public access) ─────────────────────────
CREATE POLICY "Public read access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'post-images');

-- ─── POLICY 2: Authenticated users can upload ──────────────────────────
CREATE POLICY "Authenticated upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-images');
