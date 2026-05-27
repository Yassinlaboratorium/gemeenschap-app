-- ============================================================
-- vzw De Gemeenschap — deel 10: Kids Academy + account types
-- Voer uit in Supabase SQL Editor
-- ============================================================

-- ── Account type migratie ─────────────────────────────────────
-- 'youth' → 'deelnemer' voor bestaande profielen
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_type'
  ) THEN
    UPDATE profiles SET account_type = 'deelnemer' WHERE account_type = 'youth';
  END IF;
END $$;

-- ── Academy teams ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academy_teams (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  age_group       text,
  max_players     integer DEFAULT 20,
  training_days   text[],
  training_time   text,
  location        text DEFAULT 'Mercatorstraat 24, Sint-Niklaas',
  season          text,
  price_per_season numeric(10,2),
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- ── Academy spelers ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academy_players (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id          uuid REFERENCES children(id) ON DELETE SET NULL,
  team_id           uuid REFERENCES academy_teams(id) ON DELETE CASCADE NOT NULL,
  player_name       text NOT NULL,
  date_of_birth     date,
  position          text,
  jersey_number     integer,
  medical_notes     text,
  emergency_contact text NOT NULL,
  emergency_phone   text NOT NULL,
  parent_name       text NOT NULL,
  parent_email      text NOT NULL,
  parent_phone      text NOT NULL,
  status            text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
  registered_at     timestamptz DEFAULT now(),
  UNIQUE(user_id, child_id, team_id)
);

-- ── Academy sessies (trainingen / wedstrijden) ─────────────────
CREATE TABLE IF NOT EXISTS academy_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid REFERENCES academy_teams(id) ON DELETE CASCADE NOT NULL,
  type         text DEFAULT 'training' CHECK (type IN ('training', 'match', 'tournament', 'event')),
  title        text,
  date         date NOT NULL,
  start_time   time NOT NULL,
  end_time     time,
  location     text DEFAULT 'Mercatorstraat 24, Sint-Niklaas',
  notes        text,
  is_cancelled boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- ── Aanwezigheid ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academy_attendance (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid REFERENCES academy_sessions(id) ON DELETE CASCADE NOT NULL,
  player_id    uuid REFERENCES academy_players(id) ON DELETE CASCADE NOT NULL,
  status       text DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes        text,
  recorded_by  uuid REFERENCES auth.users(id),
  recorded_at  timestamptz DEFAULT now(),
  UNIQUE(session_id, player_id)
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE academy_teams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_players     ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_attendance  ENABLE ROW LEVEL SECURITY;

-- Teams: iedereen kan actieve teams zien
CREATE POLICY "View active teams"
  ON academy_teams FOR SELECT USING (is_active = true OR is_admin());

-- Players: eigenaar ziet/beheert eigen spelers
CREATE POLICY "View own players"
  ON academy_players FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Register own players"
  ON academy_players FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own players"
  ON academy_players FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- Sessions: spelers van het team zien de sessies
CREATE POLICY "View team sessions"
  ON academy_sessions FOR SELECT USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM academy_players
      WHERE academy_players.team_id = academy_sessions.team_id
        AND academy_players.user_id = auth.uid()
    )
  );

-- Attendance: speler ziet eigen aanwezigheid
CREATE POLICY "View own attendance"
  ON academy_attendance FOR SELECT USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM academy_players
      WHERE academy_players.id = academy_attendance.player_id
        AND academy_players.user_id = auth.uid()
    )
  );

-- Admin: volledige toegang
CREATE POLICY "Admin full access teams"
  ON academy_teams FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin full access players"
  ON academy_players FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin full access sessions"
  ON academy_sessions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin full access attendance"
  ON academy_attendance FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_academy_players_team    ON academy_players(team_id);
CREATE INDEX IF NOT EXISTS idx_academy_players_user    ON academy_players(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_sessions_team   ON academy_sessions(team_id, date);
CREATE INDEX IF NOT EXISTS idx_academy_attendance_sess ON academy_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_academy_attendance_plyr ON academy_attendance(player_id);
