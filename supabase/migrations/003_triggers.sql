-- AWARTS Triggers

-- Auto-update updated_at on any table mutation
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_daily_usage_updated_at
  BEFORE UPDATE ON daily_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-set user region from country code
CREATE OR REPLACE FUNCTION sync_user_region()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.country IS NOT NULL THEN
    SELECT region INTO NEW.region
    FROM countries_to_regions
    WHERE country_code = NEW.country;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_sync_user_region
  BEFORE INSERT OR UPDATE OF country ON users
  FOR EACH ROW EXECUTE FUNCTION sync_user_region();

-- Expire stale CLI auth codes
CREATE OR REPLACE FUNCTION expire_cli_auth_codes()
RETURNS void AS $$
BEGIN
  UPDATE cli_auth_codes
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
