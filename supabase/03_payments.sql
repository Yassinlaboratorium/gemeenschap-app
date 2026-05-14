-- ============================================================
-- Mollie betalingen — voer uit in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Nieuw enum type voor betaalstatus
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'cancelled');

-- 2. Kolommen toevoegen aan registrations
ALTER TABLE registrations
  ADD COLUMN mollie_payment_id TEXT,
  ADD COLUMN payment_status    payment_status,
  ADD COLUMN paid_at           TIMESTAMPTZ;

-- Uniek index: één actieve Mollie-betaling per inschrijving
CREATE UNIQUE INDEX registrations_mollie_payment_id_key
  ON registrations (mollie_payment_id)
  WHERE mollie_payment_id IS NOT NULL;

-- 3. Helperfunctie voor de webhook — SECURITY DEFINER zodat hij RLS omzeilt
--    De functie mag alleen aangeroepen worden als de payment_id klopt.
CREATE OR REPLACE FUNCTION confirm_mollie_payment(p_payment_id TEXT, p_paid_at TIMESTAMPTZ)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE registrations
  SET
    payment_status = 'paid',
    status         = 'confirmed',
    paid_at        = p_paid_at
  WHERE
    mollie_payment_id = p_payment_id
    AND payment_status = 'pending';
END;
$$;

CREATE OR REPLACE FUNCTION fail_mollie_payment(p_payment_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE registrations
  SET
    payment_status = 'failed',
    status         = 'cancelled'
  WHERE
    mollie_payment_id = p_payment_id
    AND payment_status = 'pending';
END;
$$;
