-- Anonymous usage counts ("timetables generated" etc.).
-- No user/device ids, no IPs, no names. Writes only via /api/events (service role).

CREATE TABLE IF NOT EXISTS usage_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  campus TEXT,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON usage_events (created_at);

-- RLS on with no policies: anon and authenticated can neither read nor write.
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON usage_events FROM anon, authenticated;

-- Per event, campus and IST day, for the admin panel.
CREATE OR REPLACE VIEW usage_events_daily
WITH (security_invoker = true) AS
SELECT
  name,
  campus,
  (created_at AT TIME ZONE 'Asia/Kolkata')::date AS day,
  count(*)::int AS total
FROM usage_events
GROUP BY 1, 2, 3;

REVOKE ALL ON usage_events_daily FROM anon, authenticated;
