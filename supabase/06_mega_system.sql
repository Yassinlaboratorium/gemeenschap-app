-- ============================================================
-- 06_mega_system.sql — VOLLEDIG & IDEMPOTENT
-- Combineert alles uit 03, 04, 05 en 06.
-- Veilig op een verse of gedeeltelijk gemigreerde database.
-- ============================================================

-- ── A. payment_status type ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── B. Betalingskolommen op registrations ────────────────────
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS mollie_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status    payment_status,
  ADD COLUMN IF NOT EXISTS paid_at           TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_mollie_payment_id_key
  ON registrations (mollie_payment_id)
  WHERE mollie_payment_id IS NOT NULL;

-- ── C. Tags op activities, verwijder activity_type ENUM ──────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'tags'
  ) THEN
    ALTER TABLE activities ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'type'
  ) THEN
    DROP VIEW IF EXISTS all_registrations_analytics;
    DROP VIEW IF EXISTS activity_sessions_with_count;
    DROP VIEW IF EXISTS activities_with_count;
    UPDATE activities SET tags = ARRAY[type::text];
    ALTER TABLE activities DROP COLUMN type;
    DROP TYPE IF EXISTS activity_type;
  END IF;
END $$;

-- ── D. Profiles: demografische velden ────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT CHECK (account_type IN ('parent', 'youth')) DEFAULT 'youth',
  ADD COLUMN IF NOT EXISTS postal_code  TEXT,
  ADD COLUMN IF NOT EXISTS municipality TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- ── E. Tabel: kinderen ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS children (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name   text        NOT NULL,
  birth_date   date,
  gender       text        CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  school       text,
  postal_code  text,
  municipality text,
  neighborhood text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Extra kolommen op bestaande children tabel (no-op als ze al bestaan)
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS gender       text CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS school       text,
  ADD COLUMN IF NOT EXISTS postal_code  text,
  ADD COLUMN IF NOT EXISTS municipality text,
  ADD COLUMN IF NOT EXISTS neighborhood text;

-- ── F. Tabel: activiteits-sessies ────────────────────────────
CREATE TABLE IF NOT EXISTS activity_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id      uuid        NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  session_date     date        NOT NULL,
  start_time       time,
  end_time         time,
  title            text,
  description      text,
  max_participants int,
  price_cents      int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── G. Tabel: sessie-inschrijvingen ──────────────────────────
CREATE TABLE IF NOT EXISTS session_registrations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id       uuid        NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id          uuid        REFERENCES children(id) ON DELETE CASCADE,
  session_ids       uuid[]      NOT NULL,
  total_price_cents int         NOT NULL DEFAULT 0,
  mollie_payment_id text,
  payment_status    payment_status,
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Vervang UNIQUE constraint door partial index (child_id nullable)
ALTER TABLE session_registrations
  DROP CONSTRAINT IF EXISTS session_registrations_activity_id_child_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS session_regs_unique_child
  ON session_registrations (activity_id, child_id)
  WHERE child_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS session_registrations_mollie_key
  ON session_registrations (mollie_payment_id)
  WHERE mollie_payment_id IS NOT NULL;

-- ── H. Drop & recreate alle views ────────────────────────────
DROP VIEW IF EXISTS all_registrations_analytics;
DROP VIEW IF EXISTS activity_sessions_with_count;
DROP VIEW IF EXISTS activities_with_count;

CREATE VIEW activities_with_count AS
SELECT
  a.*,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status != 'cancelled') AS participants_count,
  COUNT(DISTINCT s.id) AS sessions_count
FROM activities a
LEFT JOIN registrations r ON r.activity_id = a.id
LEFT JOIN activity_sessions s ON s.activity_id = a.id
GROUP BY a.id;

CREATE VIEW activity_sessions_with_count AS
SELECT
  s.*,
  COUNT(DISTINCT sr.id) FILTER (
    WHERE sr.payment_status = 'paid'
      OR (sr.total_price_cents = 0 AND sr.payment_status IS NULL)
  ) AS participants_count
FROM activity_sessions s
LEFT JOIN session_registrations sr ON s.id = ANY(sr.session_ids)
GROUP BY s.id;

CREATE VIEW all_registrations_analytics AS
SELECT
  r.id,
  r.user_id,
  NULL::uuid   AS child_id,
  r.activity_id,
  r.created_at,
  r.payment_status,
  r.paid_at,
  NULL::int    AS total_price_cents,
  p.municipality,
  p.neighborhood,
  p.postal_code,
  NULL::text   AS child_municipality,
  NULL::text   AS child_neighborhood,
  NULL::text   AS child_postal_code,
  NULL::text   AS gender,
  NULL::date   AS birth_date,
  NULL::text   AS school,
  'classic'::text AS reg_type
FROM registrations r
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.status != 'cancelled'

UNION ALL

SELECT
  sr.id,
  sr.user_id,
  sr.child_id,
  sr.activity_id,
  sr.created_at,
  sr.payment_status,
  sr.paid_at,
  sr.total_price_cents,
  p.municipality,
  p.neighborhood,
  p.postal_code,
  c.municipality  AS child_municipality,
  c.neighborhood  AS child_neighborhood,
  c.postal_code   AS child_postal_code,
  c.gender,
  c.birth_date,
  c.school,
  'session'::text AS reg_type
FROM session_registrations sr
LEFT JOIN profiles p ON sr.user_id = p.id
LEFT JOIN children c ON sr.child_id = c.id
WHERE sr.payment_status = 'paid' OR sr.total_price_cents = 0;

-- ── I. Row Level Security ─────────────────────────────────────
ALTER TABLE children              ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_registrations ENABLE ROW LEVEL SECURITY;

-- children
DROP POLICY IF EXISTS "children_owner_select" ON children;
DROP POLICY IF EXISTS "children_owner_insert" ON children;
DROP POLICY IF EXISTS "children_owner_update" ON children;
DROP POLICY IF EXISTS "children_owner_delete" ON children;
DROP POLICY IF EXISTS "children_admin"         ON children;

CREATE POLICY "children_owner_select" ON children
  FOR SELECT USING (parent_id = auth.uid() OR is_admin());
CREATE POLICY "children_owner_insert" ON children
  FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "children_owner_update" ON children
  FOR UPDATE USING (parent_id = auth.uid()) WITH CHECK (parent_id = auth.uid());
CREATE POLICY "children_owner_delete" ON children
  FOR DELETE USING (parent_id = auth.uid());
CREATE POLICY "children_admin" ON children
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- activity_sessions
DROP POLICY IF EXISTS "sessions_public_read" ON activity_sessions;
DROP POLICY IF EXISTS "sessions_admin_write" ON activity_sessions;

CREATE POLICY "sessions_public_read" ON activity_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM activities a WHERE a.id = activity_sessions.activity_id AND a.is_published = true)
    OR is_admin()
  );
CREATE POLICY "sessions_admin_write" ON activity_sessions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- session_registrations
DROP POLICY IF EXISTS "session_regs_owner_read"   ON session_registrations;
DROP POLICY IF EXISTS "session_regs_owner_insert" ON session_registrations;
DROP POLICY IF EXISTS "session_regs_admin"        ON session_registrations;

CREATE POLICY "session_regs_owner_read" ON session_registrations
  FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "session_regs_owner_insert" ON session_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "session_regs_admin" ON session_registrations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Admin policies met WITH CHECK (05_fix_rls_policies)
DROP POLICY IF EXISTS "Admin beheert profielen"      ON profiles;
DROP POLICY IF EXISTS "Admin beheert activiteiten"   ON activities;
DROP POLICY IF EXISTS "Admin beheert inschrijvingen" ON registrations;

CREATE POLICY "Admin beheert profielen" ON profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin beheert activiteiten" ON activities
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin beheert inschrijvingen" ON registrations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── J. Hulpfuncties ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION confirm_mollie_payment(p_payment_id TEXT, p_paid_at TIMESTAMPTZ)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE registrations
  SET payment_status = 'paid', status = 'confirmed', paid_at = p_paid_at
  WHERE mollie_payment_id = p_payment_id AND payment_status = 'pending';
END; $$;

CREATE OR REPLACE FUNCTION fail_mollie_payment(p_payment_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE registrations
  SET payment_status = 'failed', status = 'cancelled'
  WHERE mollie_payment_id = p_payment_id AND payment_status = 'pending';
END; $$;

CREATE OR REPLACE FUNCTION confirm_session_payment(p_payment_id TEXT, p_paid_at TIMESTAMPTZ)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE session_registrations
  SET payment_status = 'paid', paid_at = p_paid_at
  WHERE mollie_payment_id = p_payment_id AND payment_status = 'pending';
END; $$;

CREATE OR REPLACE FUNCTION fail_session_payment(p_payment_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE session_registrations
  SET payment_status = 'failed'
  WHERE mollie_payment_id = p_payment_id AND payment_status = 'pending';
END; $$;

-- ── K. Indexen ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_children_parent       ON children (parent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_activity     ON activity_sessions (activity_id, session_date);
CREATE INDEX IF NOT EXISTS idx_session_regs_user     ON session_registrations (user_id);
CREATE INDEX IF NOT EXISTS idx_session_regs_child    ON session_registrations (child_id);
CREATE INDEX IF NOT EXISTS idx_session_regs_activity ON session_registrations (activity_id);
CREATE INDEX IF NOT EXISTS idx_session_regs_mollie   ON session_registrations (mollie_payment_id)
  WHERE mollie_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_municipality ON profiles (municipality);
CREATE INDEX IF NOT EXISTS idx_children_municipality ON children (municipality);
CREATE INDEX IF NOT EXISTS idx_children_birth_date   ON children (birth_date);
CREATE INDEX IF NOT EXISTS idx_session_regs_paid_at  ON session_registrations (paid_at);
CREATE INDEX IF NOT EXISTS idx_regs_created_at       ON registrations (created_at);
