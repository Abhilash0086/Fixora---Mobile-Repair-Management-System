-- ============================================================
-- FIXORA - Mobile Repair Job Card Management System
-- Supabase PostgreSQL Schema
-- ============================================================

-- Job Cards table
CREATE TABLE IF NOT EXISTS job_cards (
  id               SERIAL PRIMARY KEY,
  job_card_id      TEXT UNIQUE NOT NULL,          -- e.g. FX-2026-00001
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT,
  phone_brand      TEXT NOT NULL,
  phone_model      TEXT NOT NULL,
  reported_issue   TEXT NOT NULL,
  technician       TEXT,
  status           TEXT NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending', 'In Progress', 'Ready for Delivery', 'Delivered', 'Returned', 'Delayed')),
  eta              DATE,
  remarks          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at     TIMESTAMPTZ
);

-- Status history log
CREATE TABLE IF NOT EXISTS job_card_status_log (
  id           SERIAL PRIMARY KEY,
  job_card_id  TEXT NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
  old_status   TEXT,
  new_status   TEXT NOT NULL,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes        TEXT
);

-- WhatsApp notification log (stub for stage 2)
CREATE TABLE IF NOT EXISTS whatsapp_log (
  id           SERIAL PRIMARY KEY,
  job_card_id  TEXT NOT NULL REFERENCES job_cards(job_card_id) ON DELETE CASCADE,
  phone        TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  sent_at      TIMESTAMPTZ,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_job_cards_updated_at
  BEFORE UPDATE ON job_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Counter table for job card ID generation
CREATE TABLE IF NOT EXISTS job_card_counter (
  year   INT PRIMARY KEY,
  seq    INT NOT NULL DEFAULT 0
);

-- Function to generate next job card ID
CREATE OR REPLACE FUNCTION next_job_card_id()
RETURNS TEXT AS $$
DECLARE
  yr   INT := EXTRACT(YEAR FROM NOW());
  seq  INT;
BEGIN
  INSERT INTO job_card_counter (year, seq) VALUES (yr, 1)
  ON CONFLICT (year) DO UPDATE SET seq = job_card_counter.seq + 1
  RETURNING job_card_counter.seq INTO seq;
  RETURN 'FX-' || yr || '-' || LPAD(seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (enable for production)
ALTER TABLE job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_card_counter ENABLE ROW LEVEL SECURITY;

-- Allow full access via service role key (backend only)
CREATE POLICY "service_role_all" ON job_cards FOR ALL USING (true);
CREATE POLICY "service_role_all" ON job_card_status_log FOR ALL USING (true);
CREATE POLICY "service_role_all" ON whatsapp_log FOR ALL USING (true);
CREATE POLICY "service_role_all" ON job_card_counter FOR ALL USING (true);
