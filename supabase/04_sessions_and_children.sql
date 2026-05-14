-- ============================================================
-- Sessies, kinderen en flexibele tags
-- Voer uit na 03_payments.sql in Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. Tags vervangen activity_type ENUM ─────────────────────

ALTER TABLE activities ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
-- Migreer bestaande type-waarden naar tags
UPDATE activities SET tags = ARRAY[type::text];
-- Verwijder type kolom
ALTER TABLE activities DROP COLUMN type;
DROP TYPE activity_type;

-- ── 2. Hermaak activities_with_count view (sessions_count erbij) ──

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

-- ── 3. Tabel: kinderen ────────────────────────────────────────

CREATE TABLE children (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  birth_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 4. Tabel: activiteits-sessies ─────────────────────────────

CREATE TABLE activity_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id      uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  session_date     date NOT NULL,
  start_time       time,
  end_time         time,
  title            text,
  description      text,
  max_participants int,
  price_cents      int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Tabel: sessie-inschrijvingen ───────────────────────────

CREATE TABLE session_registrations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id       uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id          uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_ids       uuid[] NOT NULL,
  total_price_cents int NOT NULL DEFAULT 0,
  mollie_payment_id text,
  payment_status    payment_status,
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  -- Één actieve inschrijving per kind per activiteit
  UNIQUE (activity_id, child_id)
);

CREATE UNIQUE INDEX session_registrations_mollie_key
  ON session_registrations (mollie_payment_id)
  WHERE mollie_payment_id IS NOT NULL;

-- ── 6. View: sessies met deelnemerstellingen ─────────────────

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

-- ── 7. Indexen ───────────────────────────────────────────────

CREATE INDEX idx_children_parent            ON children (parent_id);
CREATE INDEX idx_sessions_activity          ON activity_sessions (activity_id, session_date);
CREATE INDEX idx_session_regs_user          ON session_registrations (user_id);
CREATE INDEX idx_session_regs_child         ON session_registrations (child_id);
CREATE INDEX idx_session_regs_activity      ON session_registrations (activity_id);
CREATE INDEX idx_session_regs_mollie        ON session_registrations (mollie_payment_id)
  WHERE mollie_payment_id IS NOT NULL;

-- ── 8. Row Level Security ─────────────────────────────────────

ALTER TABLE children              ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_registrations ENABLE ROW LEVEL SECURITY;

-- children: ouder beheert eigen kinderen
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

-- activity_sessions: publiek lezen voor gepubliceerde activiteiten
CREATE POLICY "sessions_public_read" ON activity_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_sessions.activity_id
        AND a.is_published = true
    )
    OR is_admin()
  );

-- Admin kan alles doen met sessies — WITH CHECK vereist voor INSERT/UPDATE
CREATE POLICY "sessions_admin_write" ON activity_sessions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- session_registrations: gebruiker ziet/maakt eigen inschrijvingen
CREATE POLICY "session_regs_owner_read" ON session_registrations
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "session_regs_owner_insert" ON session_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin beheert alles
CREATE POLICY "session_regs_admin" ON session_registrations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── 9. Hulpfuncties voor Mollie-webhook ──────────────────────

CREATE OR REPLACE FUNCTION confirm_session_payment(p_payment_id TEXT, p_paid_at TIMESTAMPTZ)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE session_registrations
  SET
    payment_status = 'paid',
    paid_at        = p_paid_at
  WHERE
    mollie_payment_id = p_payment_id
    AND payment_status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION fail_session_payment(p_payment_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE session_registrations
  SET payment_status = 'failed'
  WHERE
    mollie_payment_id = p_payment_id
    AND payment_status = 'pending';
END;
$$;
