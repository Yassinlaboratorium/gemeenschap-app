-- ============================================================
-- Mega-systeem: demografische data, analytics, uitgebreide profielen
-- Voer uit na 05_fix_rls_policies.sql in Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. Profiles: demografische velden ────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT CHECK (account_type IN ('parent', 'youth')) DEFAULT 'youth',
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS municipality TEXT CHECK (municipality IN ('Sint-Niklaas','Beveren','Temse','Stekene','Kruibeke')),
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- ── 2. Children: uitgebreide demografische velden ────────────

ALTER TABLE children
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS municipality TEXT CHECK (municipality IN ('Sint-Niklaas','Beveren','Temse','Stekene','Kruibeke')),
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- ── 3. Drop partial unique index als die nog niet bestaat ────

-- session_registrations heeft al UNIQUE(activity_id, child_id) maar we willen
-- een partial index zodat child_id IS NULL (jeugd schrijft zichzelf in) ook kan.
-- Verwijder bestaande constraint en vervang door partial index.
ALTER TABLE session_registrations
  DROP CONSTRAINT IF EXISTS session_registrations_activity_id_child_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS session_regs_unique_child
  ON session_registrations (activity_id, child_id)
  WHERE child_id IS NOT NULL;

-- ── 4. Drop & recreate activities_with_count view ────────────

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

-- ── 5. Drop & recreate activity_sessions_with_count view ─────

DROP VIEW IF EXISTS activity_sessions_with_count;

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

-- ── 6. Analytics views ───────────────────────────────────────

-- Combineer session_registrations + registrations in één view voor analytics
CREATE OR REPLACE VIEW all_registrations_analytics AS
-- Klassieke inschrijvingen
SELECT
  r.id,
  r.user_id,
  NULL::uuid AS child_id,
  r.activity_id,
  r.created_at,
  r.payment_status,
  r.paid_at,
  NULL::int AS total_price_cents,
  p.municipality,
  p.neighborhood,
  p.postal_code,
  NULL::text AS child_municipality,
  NULL::text AS child_neighborhood,
  NULL::text AS child_postal_code,
  NULL::text AS gender,
  NULL::date AS birth_date,
  NULL::text AS school,
  'classic'::text AS reg_type
FROM registrations r
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.status != 'cancelled'

UNION ALL

-- Sessie-inschrijvingen met kind
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
  c.municipality AS child_municipality,
  c.neighborhood AS child_neighborhood,
  c.postal_code AS child_postal_code,
  c.gender,
  c.birth_date,
  c.school,
  'session'::text AS reg_type
FROM session_registrations sr
LEFT JOIN profiles p ON sr.user_id = p.id
LEFT JOIN children c ON sr.child_id = c.id
WHERE sr.payment_status IN ('paid') OR sr.total_price_cents = 0;

-- ── 7. Extra indexen voor analytics ──────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_municipality  ON profiles (municipality);
CREATE INDEX IF NOT EXISTS idx_children_municipality  ON children (municipality);
CREATE INDEX IF NOT EXISTS idx_children_birth_date    ON children (birth_date);
CREATE INDEX IF NOT EXISTS idx_session_regs_paid_at   ON session_registrations (paid_at);
CREATE INDEX IF NOT EXISTS idx_regs_created_at        ON registrations (created_at);
