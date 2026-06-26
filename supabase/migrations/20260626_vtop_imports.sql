CREATE TABLE IF NOT EXISTS vtop_imports (
  id TEXT PRIMARY KEY,
  payload_json JSONB NOT NULL,
  campus TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vtop_imports_expires_at_idx ON vtop_imports (expires_at);

ALTER TABLE vtop_imports ENABLE ROW LEVEL SECURITY;
