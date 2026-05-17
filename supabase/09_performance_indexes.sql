-- ============================================================
-- 09_performance_indexes.sql — Ontbrekende composite indexen
-- Voer uit in Supabase Dashboard > SQL Editor
-- ============================================================

-- Composite index voor analytics-query op registrations:
-- WHERE payment_status = 'paid' AND created_at BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_registrations_payment_date
  ON registrations (payment_status, created_at);

-- Composite index voor analytics-query op session_registrations:
-- WHERE payment_status = 'paid' AND created_at BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_session_regs_payment_date
  ON session_registrations (payment_status, created_at);

-- Composite index voor publieke activiteitenlijst:
-- WHERE is_published = true ORDER BY date
CREATE INDEX IF NOT EXISTS idx_activities_published_date
  ON activities (is_published, date);

-- Index op push_subscriptions.user_id voor snelle lookup
-- (UNIQUE (user_id, endpoint) constraint dekt dit al, maar expliciete single-col index is sneller)
CREATE INDEX IF NOT EXISTS idx_push_subs_user
  ON push_subscriptions (user_id);
