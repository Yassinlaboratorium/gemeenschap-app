-- ============================================================
-- Verwijder CHECK constraints op municipality kolommen
-- Gemeente is nu een vrij tekstveld zonder restricties.
-- ============================================================

-- Verwijder CHECK constraint op profiles.municipality
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_municipality_check;

-- Verwijder CHECK constraint op children.municipality
ALTER TABLE children
  DROP CONSTRAINT IF EXISTS children_municipality_check;
