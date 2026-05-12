-- ============================================================
-- vzw De Gemeenschap – deel 2: functies, triggers, views, RLS
-- Voer dit uit ná 01_tables.sql
-- ============================================================

-- ── Functies & triggers ──────────────────────────────────────

-- Maak automatisch een profiel aan bij registratie
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Blokkeer inschrijving als activiteit vol zit
CREATE OR REPLACE FUNCTION check_activity_capacity()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  max_cap   int;
  cur_count int;
BEGIN
  SELECT max_participants INTO max_cap FROM activities WHERE id = NEW.activity_id;

  IF max_cap IS NULL THEN
    RETURN NEW; -- geen limiet
  END IF;

  SELECT COUNT(*) INTO cur_count
  FROM registrations
  WHERE activity_id = NEW.activity_id AND status != 'cancelled';

  IF cur_count >= max_cap THEN
    RAISE EXCEPTION 'Activiteit is volzet';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_capacity
  BEFORE INSERT ON registrations
  FOR EACH ROW EXECUTE FUNCTION check_activity_capacity();

-- ── Views ────────────────────────────────────────────────────

CREATE VIEW activities_with_count AS
SELECT
  a.*,
  COUNT(r.id) FILTER (WHERE r.status != 'cancelled') AS participants_count
FROM activities a
LEFT JOIN registrations r ON r.activity_id = a.id
GROUP BY a.id;

-- ── Indexen ──────────────────────────────────────────────────

CREATE INDEX idx_activities_date        ON activities (date);
CREATE INDEX idx_activities_published   ON activities (is_published);
CREATE INDEX idx_registrations_user     ON registrations (user_id);
CREATE INDEX idx_registrations_activity ON registrations (activity_id);

-- ── Row Level Security ───────────────────────────────────────

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Hulpfunctie: is de ingelogde gebruiker admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- profiles
CREATE POLICY "Gebruiker leest eigen profiel"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Gebruiker past eigen profiel aan"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admin beheert profielen"
  ON profiles FOR ALL
  USING (is_admin());

-- activities
CREATE POLICY "Publiek ziet gepubliceerde activiteiten"
  ON activities FOR SELECT
  USING (is_published = true OR is_admin());

CREATE POLICY "Admin beheert activiteiten"
  ON activities FOR ALL
  USING (is_admin());

-- registrations
CREATE POLICY "Gebruiker ziet eigen inschrijvingen"
  ON registrations FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Gebruiker schrijft zichzelf in"
  ON registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Gebruiker annuleert eigen inschrijving"
  ON registrations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (status = 'cancelled');

CREATE POLICY "Admin beheert inschrijvingen"
  ON registrations FOR ALL
  USING (is_admin());
