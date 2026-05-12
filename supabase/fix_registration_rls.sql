-- ============================================================
-- Fix: inschrijf-RLS voor herregistratie (cancelled → confirmed)
-- Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- De oude policy laat alleen cancelled toe als nieuwe status.
-- Daardoor faalt herregistratie na annulering.
DROP POLICY IF EXISTS "Gebruiker annuleert eigen inschrijving" ON registrations;

-- Annuleren: actieve inschrijving → cancelled
CREATE POLICY "Gebruiker annuleert inschrijving"
  ON registrations FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('pending', 'confirmed'))
  WITH CHECK (status = 'cancelled');

-- Herregistreren: geannuleerde inschrijving → confirmed
CREATE POLICY "Gebruiker herneemt inschrijving"
  ON registrations FOR UPDATE
  USING (user_id = auth.uid() AND status = 'cancelled')
  WITH CHECK (status = 'confirmed');
