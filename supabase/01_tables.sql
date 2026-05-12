-- ============================================================
-- vzw De Gemeenschap – deel 1: tabellen
-- Voer dit eerst uit vóór 02_logic.sql
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
