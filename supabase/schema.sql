-- ============================================================
-- vzw De Gemeenschap – database schema
-- Plak dit in Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ── Types ────────────────────────────────────────────────────

CREATE TYPE activity_type AS ENUM ('workshop', 'uitstap', 'evenement');
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- ── Profielen (verlengt auth.users) ─────────────────────────

CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  birth_date  date,
  phone       text,
  is_admin    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

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

-- ── Activiteiten ─────────────────────────────────────────────

CREATE TABLE activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  description      text,
  type             activity_type NOT NULL,
  date             date NOT NULL,
  start_time       time,
  end_time         time,
  location         text,
  max_participants int CHECK (max_participants > 0),
  price            numeric(6, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  image_url        text,
  is_published     boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Handige view: activiteiten met inschrijftelling
CREATE VIEW activities_with_count AS
SELECT
  a.*,
  COUNT(r.id) FILTER (WHERE r.status != 'cancelled') AS participants_count
FROM activities a
LEFT JOIN registrations r ON r.activity_id = a.id
GROUP BY a.id;

-- ── Inschrijvingen ───────────────────────────────────────────

CREATE TABLE registrations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      registration_status NOT NULL DEFAULT 'pending',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id)
);

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

-- ── Indexen ──────────────────────────────────────────────────

CREATE INDEX idx_activities_date        ON activities (date);
CREATE INDEX idx_activities_published   ON activities (is_published);
CREATE INDEX idx_registrations_user     ON registrations (user_id);
CREATE INDEX idx_registrations_activity ON registrations (activity_id);

-- ── Row Level Security ───────────────────────────────────────

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities   ENABLE ROW LEVEL SECURITY;
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

-- activities: iedereen ziet gepubliceerde, admin beheert alles
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
