-- Additive attribution and reconstructible participant BEST projection.
-- Existing submissions, receipts, BEST rows, moderation and Analytics are retained.
CREATE TABLE record_participants (
 participant_id TEXT PRIMARY KEY,
 public_label TEXT NOT NULL UNIQUE,
 credential_hash TEXT NOT NULL UNIQUE CHECK(length(credential_hash)=64),
 created_at TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled'))
);
ALTER TABLE record_submissions ADD COLUMN participant_id TEXT REFERENCES record_participants(participant_id);
-- NULL identifies legacy_unattributed: retain ledger, never infer an owner or publish a name.
CREATE INDEX record_participant_candidates ON record_submissions(board_id,participant_id,status,value,received_at,id);
CREATE INDEX record_participant_boards ON record_submissions(participant_id,board_id,status);
CREATE TABLE record_participant_bests (
 board_id TEXT NOT NULL REFERENCES record_boards(board_id),
 participant_id TEXT NOT NULL REFERENCES record_participants(participant_id),
 submission_id TEXT NOT NULL REFERENCES record_submissions(id),
 value INTEGER NOT NULL, rank_value INTEGER NOT NULL, received_at TEXT NOT NULL,
 PRIMARY KEY(board_id,participant_id)
);
CREATE INDEX record_leaderboard_top ON record_participant_bests(board_id,rank_value,received_at,submission_id);
CREATE TABLE record_leaderboard_revisions (
 board_id TEXT PRIMARY KEY REFERENCES record_boards(board_id), revision INTEGER NOT NULL DEFAULT 0
);
INSERT INTO record_leaderboard_revisions SELECT board_id,0 FROM record_boards;
-- Registration uses a separate global durable counter; no IP/browser/fingerprint fields.
CREATE TABLE record_participant_admission (slot INTEGER PRIMARY KEY CHECK(slot=1),window_start INTEGER NOT NULL,registrations INTEGER NOT NULL);
INSERT INTO record_participant_admission VALUES(1,0,0);
CREATE TRIGGER record_participant_admission_check BEFORE INSERT ON record_participants
WHEN NOT EXISTS(SELECT 1 FROM record_participants WHERE credential_hash=NEW.credential_hash)
BEGIN
 SELECT CASE WHEN (SELECT CASE WHEN window_start=CAST(strftime('%s','now') AS INTEGER)/60 THEN registrations ELSE 0 END FROM record_participant_admission WHERE slot=1)>=60 THEN RAISE(ABORT,'records_registration_rate_limited') END;
END;
CREATE TRIGGER record_participant_admission_count AFTER INSERT ON record_participants
BEGIN
 UPDATE record_participant_admission SET registrations=CASE WHEN window_start=CAST(strftime('%s','now') AS INTEGER)/60 THEN registrations+1 ELSE 1 END,window_start=CAST(strftime('%s','now') AS INTEGER)/60 WHERE slot=1;
END;
-- Replace only derived-BEST maintenance; the original admission/pending safeguards remain.
DROP TRIGGER record_insert_best;
DROP TRIGGER record_status_best;
CREATE TRIGGER record_insert_best AFTER INSERT ON record_submissions
BEGIN
 UPDATE record_admission SET submissions=CASE WHEN window_start=CAST(strftime('%s','now') AS INTEGER)/60 THEN submissions+1 ELSE 1 END,window_start=CAST(strftime('%s','now') AS INTEGER)/60 WHERE slot=1;

 DELETE FROM record_participant_bests WHERE board_id=NEW.board_id AND participant_id=NEW.participant_id;
 INSERT INTO record_participant_bests(board_id,participant_id,submission_id,value,rank_value,received_at)
 SELECT s.board_id,s.participant_id,s.id,s.value,CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END,s.received_at
 FROM record_submissions s JOIN record_boards b ON b.board_id=s.board_id
 JOIN record_participants p ON p.participant_id=s.participant_id AND p.status='active'
 WHERE s.board_id=NEW.board_id AND s.participant_id=NEW.participant_id AND s.status='accepted'
 ORDER BY CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END,s.received_at,s.id LIMIT 1;
 INSERT INTO record_leaderboard_revisions(board_id,revision) VALUES(NEW.board_id,1)
 ON CONFLICT(board_id) DO UPDATE SET revision=revision+1;
 INSERT INTO record_bests(board_id,submission_id,revision,updated_at) VALUES(NEW.board_id,NULL,0,NEW.received_at) ON CONFLICT(board_id) DO NOTHING;
 UPDATE record_bests SET submission_id=(SELECT submission_id FROM record_participant_bests WHERE board_id=NEW.board_id ORDER BY rank_value,received_at,submission_id LIMIT 1),
 revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE board_id=NEW.board_id;
END;
CREATE TRIGGER record_status_best AFTER UPDATE OF status ON record_submissions WHEN OLD.status<>NEW.status
BEGIN

 DELETE FROM record_participant_bests WHERE board_id=NEW.board_id AND participant_id=NEW.participant_id;
 INSERT INTO record_participant_bests(board_id,participant_id,submission_id,value,rank_value,received_at)
 SELECT s.board_id,s.participant_id,s.id,s.value,CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END,s.received_at
 FROM record_submissions s JOIN record_boards b ON b.board_id=s.board_id
 JOIN record_participants p ON p.participant_id=s.participant_id AND p.status='active'
 WHERE s.board_id=NEW.board_id AND s.participant_id=NEW.participant_id AND s.status='accepted'
 ORDER BY CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END,s.received_at,s.id LIMIT 1;
 INSERT INTO record_leaderboard_revisions(board_id,revision) VALUES(NEW.board_id,1)
 ON CONFLICT(board_id) DO UPDATE SET revision=revision+1;
 INSERT INTO record_bests(board_id,submission_id,revision,updated_at) VALUES(NEW.board_id,NULL,0,NEW.received_at) ON CONFLICT(board_id) DO NOTHING;
 UPDATE record_bests SET submission_id=(SELECT submission_id FROM record_participant_bests WHERE board_id=NEW.board_id ORDER BY rank_value,received_at,submission_id LIMIT 1),
 revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE board_id=NEW.board_id;
END;
-- Attribution and result values are immutable; statuses are the supported ledger mutation.
CREATE TRIGGER record_submission_identity_immutable BEFORE UPDATE OF board_id,participant_id,value,received_at,id ON record_submissions
WHEN OLD.board_id IS NOT NEW.board_id OR OLD.participant_id IS NOT NEW.participant_id OR OLD.value IS NOT NEW.value OR OLD.received_at IS NOT NEW.received_at OR OLD.id IS NOT NEW.id
BEGIN SELECT RAISE(ABORT,'records_identity_immutable'); END;
CREATE TRIGGER record_participant_status_bests AFTER UPDATE OF status ON record_participants WHEN OLD.status<>NEW.status
BEGIN
 DELETE FROM record_participant_bests WHERE participant_id=NEW.participant_id;
 INSERT INTO record_participant_bests(board_id,participant_id,submission_id,value,rank_value,received_at)
 SELECT board_id,participant_id,id,value,rank_value,received_at FROM (
  SELECT s.board_id,s.participant_id,s.id,s.value,CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END AS rank_value,s.received_at,
   ROW_NUMBER() OVER(PARTITION BY s.board_id ORDER BY CASE WHEN b.direction='higher' THEN -s.value ELSE s.value END,s.received_at,s.id) AS n
  FROM record_submissions s JOIN record_boards b ON b.board_id=s.board_id
  WHERE s.participant_id=NEW.participant_id AND s.status='accepted' AND NEW.status='active'
 ) WHERE n=1;
 INSERT INTO record_leaderboard_revisions(board_id,revision) SELECT DISTINCT board_id,1 FROM record_submissions WHERE participant_id=NEW.participant_id
 ON CONFLICT(board_id) DO UPDATE SET revision=revision+1;
 UPDATE record_bests SET submission_id=(SELECT submission_id FROM record_participant_bests p WHERE p.board_id=record_bests.board_id ORDER BY rank_value,received_at,submission_id LIMIT 1),revision=revision+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
 WHERE board_id IN (SELECT board_id FROM record_submissions WHERE participant_id=NEW.participant_id);
END;
