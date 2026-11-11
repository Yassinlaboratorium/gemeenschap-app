-- ============================================================
-- 11 · Betaling en inschrijvingen dichtzetten in RLS
-- Supabase Dashboard > SQL Editor > New query
--
-- BELANGRIJK: voer dit pas uit NADAT de bijhorende code live staat.
-- De app schrijft inschrijvingen vanaf dan via de server (service role),
-- nadat gebruiker, activiteit en prijs gecontroleerd zijn. Met de oude
-- code zouden inschrijvingen na dit script mislukken.
--
-- Probleem dat dit oplost:
--   De oude policies controleerden bij INSERT alleen `user_id = auth.uid()`.
--   Een ingelogde gebruiker kon daardoor rechtstreeks via de API een
--   inschrijving met payment_status = 'paid' aanmaken, of een geannuleerde
--   betalende inschrijving zonder betaling weer op 'confirmed' zetten.
-- ============================================================

-- registrations: gebruikers mogen alleen nog lezen
DROP POLICY IF EXISTS "Gebruiker schrijft zichzelf in"         ON registrations;
DROP POLICY IF EXISTS "Gebruiker annuleert eigen inschrijving" ON registrations;
DROP POLICY IF EXISTS "Gebruiker annuleert inschrijving"       ON registrations;
DROP POLICY IF EXISTS "Gebruiker herneemt inschrijving"        ON registrations;

-- session_registrations: gebruikers mogen alleen nog lezen
DROP POLICY IF EXISTS "session_regs_owner_insert" ON session_registrations;

-- academy_players: eigen spelers aanpassen mag, maar niet aan iemand anders toewijzen
DROP POLICY IF EXISTS "Update own players" ON academy_players;
CREATE POLICY "Update own players"
  ON academy_players FOR UPDATE
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- Controle: dit hoort alleen SELECT-policies voor gewone gebruikers en de
-- admin-policies te tonen.
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('registrations', 'session_registrations', 'academy_players')
ORDER BY tablename, policyname;
