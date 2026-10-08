-- Additive records ledger. Analytics tables and retention remain independent.
CREATE TABLE record_boards (
 board_id TEXT PRIMARY KEY, game_id TEXT NOT NULL, metric_id TEXT NOT NULL,
 ruleset_id TEXT NOT NULL, mode_id TEXT NOT NULL, direction TEXT NOT NULL CHECK(direction IN ('higher','lower')),
 storage_scale INTEGER NOT NULL CHECK(storage_scale > 0), public_enabled INTEGER NOT NULL DEFAULT 1,
 collected_since TEXT NOT NULL
);
CREATE TABLE record_submissions (
 id TEXT PRIMARY KEY, submission_key TEXT NOT NULL UNIQUE, run_result_id TEXT NOT NULL,
 board_id TEXT NOT NULL REFERENCES record_boards(board_id), value INTEGER NOT NULL CHECK(value >= 0),
 received_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('accepted','pending','rejected','revoked','withdrawn')),
 metadata_json TEXT NOT NULL, content_hash TEXT NOT NULL, receipt_hash TEXT NOT NULL,
 validation_version INTEGER NOT NULL, inspection_reason TEXT, expires_at TEXT,
 UNIQUE(board_id,run_result_id)
);
CREATE INDEX record_candidates ON record_submissions(board_id,status,value,received_at,id);
CREATE INDEX record_pending_expiry ON record_submissions(status,expires_at);
CREATE TABLE record_bests (
 board_id TEXT PRIMARY KEY REFERENCES record_boards(board_id), submission_id TEXT,
 revision INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE TABLE record_moderation (
 operation_key TEXT PRIMARY KEY, content_hash TEXT NOT NULL, target_id TEXT NOT NULL,
 old_status TEXT NOT NULL, new_status TEXT NOT NULL, reason TEXT NOT NULL, occurred_at TEXT NOT NULL
);
-- One fixed service-wide counter, never an IP/device/user identifier. Atomic admission.
CREATE TABLE record_admission (slot INTEGER PRIMARY KEY CHECK(slot=1), window_start INTEGER NOT NULL, submissions INTEGER NOT NULL);
INSERT INTO record_admission VALUES(1,0,0);
CREATE TRIGGER record_admission_check BEFORE INSERT ON record_submissions
BEGIN
 SELECT CASE WHEN (SELECT CASE WHEN window_start=CAST(strftime('%s','now') AS INTEGER)/60 THEN submissions ELSE 0 END FROM record_admission WHERE slot=1)>=120 THEN RAISE(ABORT,'records_rate_limited') END;
 SELECT CASE WHEN NEW.status='pending' AND (SELECT COUNT(*) FROM record_submissions WHERE status='pending')>=2000 THEN RAISE(ABORT,'records_pending_full') END;
END;
CREATE TRIGGER record_insert_best AFTER INSERT ON record_submissions
BEGIN
 UPDATE record_admission SET submissions=CASE WHEN window_start=CAST(strftime('%s','now') AS INTEGER)/60 THEN submissions+1 ELSE 1 END,window_start=CAST(strftime('%s','now') AS INTEGER)/60 WHERE slot=1;
 INSERT INTO record_bests(board_id,submission_id,revision,updated_at)
 VALUES(NEW.board_id,NULL,0,NEW.received_at) ON CONFLICT(board_id) DO NOTHING;
 UPDATE record_bests SET submission_id=(SELECT s.id FROM record_submissions s JOIN record_boards b ON b.board_id=s.board_id WHERE s.board_id=NEW.board_id AND s.status='accepted' ORDER BY CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END,s.received_at,s.id LIMIT 1),revision=revision+1,updated_at=NEW.received_at WHERE board_id=NEW.board_id;
END;
CREATE TRIGGER record_status_best AFTER UPDATE OF status ON record_submissions WHEN OLD.status<>NEW.status
BEGIN
 UPDATE record_bests SET submission_id=(SELECT s.id FROM record_submissions s JOIN record_boards b ON b.board_id=s.board_id WHERE s.board_id=NEW.board_id AND s.status='accepted' ORDER BY CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END,s.received_at,s.id LIMIT 1),revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE board_id=NEW.board_id;
END;
