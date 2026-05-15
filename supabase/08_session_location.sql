-- Voeg locatie-kolom toe aan activity_sessions
ALTER TABLE activity_sessions
  ADD COLUMN IF NOT EXISTS location TEXT;
