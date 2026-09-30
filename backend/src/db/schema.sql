-- LeadTrack schema (Stage 5: authentication + user ownership)
--
-- Idempotent: safe to run repeatedly against any fresh database, and also
-- upgrades an existing Stage 4 database (see the ALTER steps below).
-- Applied by `npm run db:init` (see src/db/init.js).
--
-- `leads.id` is the API's public identifier LT-<digits>; `users.id` follows
-- the same convention as US-<digits>. Both numeric tails come from dedicated
-- sequences so the database owns id generation.

-- ============================================================
-- users
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS users_id_seq
  AS integer
  START WITH 1001
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL
                CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  email         TEXT NOT NULL UNIQUE
                CHECK (
                  length(btrim(email)) BETWEEN 3 AND 254
                  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'
                ),
  password_hash TEXT NOT NULL
                CHECK (length(password_hash) > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- ============================================================
-- leads  (now owned by a user)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS leads_id_seq
  AS integer
  START WITH 1041
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE TABLE IF NOT EXISTS leads (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL
             CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  company    TEXT NOT NULL DEFAULT ''
             CHECK (length(company) <= 160),
  email      TEXT NOT NULL
             CHECK (
               length(btrim(email)) BETWEEN 3 AND 254
               AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'
             ),
  phone      TEXT NOT NULL DEFAULT ''
             CHECK (phone = '' OR phone ~ '^[\d+() .-]{6,32}$'),
  source     TEXT NOT NULL
             CHECK (source IN (
               'website','referral','linkedin','upwork','fiverr',
               'social_media','other'
             )),
  status     TEXT NOT NULL
             CHECK (status IN (
               'new','contacted','qualified','won','lost'
             )),
  notes      TEXT NOT NULL DEFAULT ''
             CHECK (length(notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -- Stage 4 -> 5 migration for databases that already have a `leads` table -- --
-- 1. Attach the ownership column (nullable first, references users).
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- 2. Sample/development leads created before users existed have no owner and
--    cannot be assigned to a specific person, so they are removed rather than
--    silently handed to someone. Fresh databases have no rows here and are
--    unaffected.
DELETE FROM leads WHERE user_id IS NULL;

-- 3. Every lead must now point at a real user, enforced by the database.
ALTER TABLE leads ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads (user_id);

-- Keep leads.updated_at moving on every PATCH.
CREATE OR REPLACE FUNCTION touch_lead_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_touch_updated_at ON leads;
CREATE TRIGGER leads_touch_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION touch_lead_updated_at();