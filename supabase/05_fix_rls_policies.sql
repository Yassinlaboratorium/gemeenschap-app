-- ============================================================
-- Fix: voeg WITH CHECK toe aan admin FOR ALL policies
-- Voer uit na 02_logic.sql in Supabase Dashboard > SQL Editor
-- ============================================================

ALTER POLICY "Admin beheert profielen" ON profiles
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "Admin beheert activiteiten" ON activities
  USING (is_admin()) WITH CHECK (is_admin());

ALTER POLICY "Admin beheert inschrijvingen" ON registrations
  USING (is_admin()) WITH CHECK (is_admin());
