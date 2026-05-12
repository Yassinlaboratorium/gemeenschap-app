-- ============================================================
-- Fix: voer dit uit als je 02_logic.sql al eerder hebt gedraaid
-- Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Fix 1: search_path ontbrak → trigger kon profiles tabel niet vinden
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Onbekend')
  );
  RETURN NEW;
END;
$$;

-- Fix 2: zelfde probleem voor is_admin()
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Fix 3: WITH CHECK toevoegen zodat gebruikers zichzelf geen admin kunnen maken
DROP POLICY IF EXISTS "Gebruiker past eigen profiel aan" ON profiles;
CREATE POLICY "Gebruiker past eigen profiel aan"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND is_admin = false);
