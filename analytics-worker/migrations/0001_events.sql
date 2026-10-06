CREATE TABLE IF NOT EXISTS events (
 event_id TEXT PRIMARY KEY,
 received_at TEXT NOT NULL,
 occurred_at TEXT NOT NULL,
 schema_version INTEGER NOT NULL,
 browser_id TEXT NOT NULL,
 visit_id TEXT NOT NULL,
 session_id TEXT NOT NULL,
 run_id TEXT,
 game_id TEXT NOT NULL,
 event_name TEXT NOT NULL,
 game_version TEXT NOT NULL,
 rules_version TEXT NOT NULL,
 presentation_version TEXT NOT NULL,
 device_class TEXT NOT NULL,
 input_type TEXT NOT NULL,
 page TEXT NOT NULL,
 utm_source TEXT,
 utm_medium TEXT,
 utm_campaign TEXT,
 utm_content TEXT,
 utm_term TEXT,
 environment TEXT NOT NULL,
 data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_occurred ON events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_game_time ON events(game_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_name_time ON events(event_name, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_browser_time ON events(browser_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_visit ON events(visit_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE TABLE IF NOT EXISTS daily_aggregates (
 day TEXT NOT NULL,
 game_id TEXT NOT NULL,
 environment TEXT NOT NULL,
 game_version TEXT NOT NULL,
 rules_version TEXT NOT NULL,
 presentation_version TEXT NOT NULL,
 metrics_json TEXT NOT NULL,
 PRIMARY KEY(day, game_id, environment, game_version, rules_version, presentation_version)
);
