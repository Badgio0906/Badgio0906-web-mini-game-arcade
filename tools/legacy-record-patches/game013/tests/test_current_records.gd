extends SceneTree

class FakeEndpoint:
	extends RefCounted
	var calls: Array = []
	var count := 0
	func startRun(game_id: String, rules: String, mode: String, practice: bool) -> String:
		count += 1
		calls.append(["start", game_id, rules, mode, practice])
		return "native-test-%d" % count
	func finishRun(game_id: String, result_id: String, rules: String, mode: String, value: int, practice: bool) -> void:
		calls.append(["finish", game_id, result_id, rules, mode, value, practice])
	func currentBest(game_id: String, value: int) -> void: calls.append(["current", game_id, value])
	func legacyBest(game_id: String, value: int) -> void: calls.append(["legacy", game_id, value])
	func storageError(game_id: String) -> void: calls.append(["error", game_id])
	func cancelRun(game_id: String) -> void: calls.append(["cancel", game_id])

class TestBridge:
	extends "res://scripts/RecordBridge.gd"
	var endpoint: Object
	func _interface() -> Object: return endpoint

class TestGame:
	extends "res://scripts/game_manager.gd"
	var preference_saves := 0
	func load_preferences() -> void: pass
	func save_preferences() -> void: preference_saves += 1

var checks := 0
var failures := 0
func check(condition: bool, label: String) -> void:
	checks += 1
	if not condition:
		failures += 1
		push_error(label)
	else: print("PASS: ", label)

func _initialize() -> void: run.call_deferred()

func run() -> void:
	var store := preload("res://scripts/CurrentRecordSave.gd").new()
	store.save_path = "user://test_game013_current_records.cfg"
	DirAccess.remove_absolute(store.save_path)
	check(store.load_best("game013.normal.r1", 11400).status == "missing", "Missing current BEST is distinct from saved zero")
	check(store.save_best("game013.normal.r1", 0, 11400).status == "ok", "Genuine finalized zero is persisted")
	check(store.save_best("game013.normal.r1", 700, 11400).value == 700, "Current native BEST improves")
	check(store.save_best("game013.normal.r1", 100, 11400).value == 700, "Lower scores do not regress BEST")
	check(store.save_best("game013.ojt.r1", 1000, 11400).status == "ok", "OJT has a distinct native section")
	check(store.load_best("game013.normal.r1", 11400).value == 700, "OJT save leaves normal value intact")
	check(store.save_best("game013.normal.r1", 11401, 11400).status == "error", "Impossible score is not saved")
	var cfg := ConfigFile.new()
	cfg.load(store.save_path)
	cfg.set_value("game013.normal.r1", "best", true)
	cfg.save(store.save_path)
	var broken := FileAccess.get_file_as_bytes(store.save_path)
	check(store.load_best("game013.normal.r1", 11400).status == "error", "Malformed typed BEST is reported")
	check(store.save_best("game013.normal.r1", 100, 11400).status == "error" and FileAccess.get_file_as_bytes(store.save_path) == broken, "Corrupt BEST remains intact rather than overwritten")
	DirAccess.remove_absolute(store.save_path)
	var endpoint := FakeEndpoint.new()
	var bridge := TestBridge.new()
	bridge.endpoint = endpoint
	var game := TestGame.new()
	root.add_child(game)
	await process_frame
	game.set_process(false)
	check(game.record_debug_excluded, "Headless script fixture is excluded by default")
	game.record_bridge = bridge
	game.current_record_save = store
	game.record_debug_excluded = false
	game.test_mode = false
	game.begin_stage(0)
	check(endpoint.calls.is_empty() and not game.record_active, "Native practice starts no standard RUN")
	game.scoring.score = 500
	game.finish_stage()
	check(endpoint.calls.is_empty(), "Practice result is not finalized as current BEST")
	game.ojt_mode = false
	game.begin_stage(1)
	var first_id: String = game.record_result_id
	game.scoring.score = 300
	game.finish_stage()
	check(endpoint.calls.size() == 1 and game.state == "between", "Intermediate stage result sends no final record")
	game.begin_stage(2)
	check(game.record_result_id == first_id and endpoint.calls.size() == 1 and game.scoring.score == 300, "Three stages retain one RUN and cumulative original score")
	game.state = "paused"
	game.toggle_ojt()
	game.toggle_ojt()
	check(not game.ojt_mode and game.record_ojt_used, "OJT ON then OFF remains assisted for this RUN")
	game.scoring.score = 800
	game.show_result(false)
	check(endpoint.calls.size() == 2 and endpoint.calls[-1][4] == "ojt", "Assisted final result is explicitly OJT")
	check(store.load_best("game013.normal.r1", 11400).status == "missing" and store.load_best("game013.ojt.r1", 11400).value == 800, "Assisted score never becomes normal BEST")
	game.show_result(false)
	check(endpoint.calls.size() == 2, "Repeated result finalization sends once")
	game.begin_stage(1)
	check(game.record_result_id != first_id and not game.record_ojt_used, "Retry has a fresh RUN and reset assistance history")
	game.scoring.score = 400
	game.show_result(false)
	check(endpoint.calls[-1][4] == "normal" and store.load_best("game013.normal.r1", 11400).value == 400, "Unassisted finalized score uses normal authority")
	game.ojt_mode = true
	game.begin_stage(1)
	check(endpoint.calls[-1][3] == "ojt", "RUN starting with OJT advertises assistance immediately")
	game.show_title()
	check(endpoint.calls[-1] == ["cancel", "game013"], "Native TITLE cancels the parent record scope")
	var before := endpoint.calls.size()
	game.show_result(false)
	check(endpoint.calls.size() == before, "Abandoned RUN does not later synthesize a final result")
	game.record_debug_excluded = true
	game.begin_stage(1)
	game.show_result(true)
	check(endpoint.calls.size() == before, "Debug capture mode emits no standard record")
	check(game.preference_saves > 0, "Original preference-save call sites remain in use")
	game.audio.stop()
	for player in game.audio.get_children():
		if player is AudioStreamPlayer:
			player.stop()
			player.stream = null
	await create_timer(0.25).timeout
	game.queue_free()
	await process_frame
	DirAccess.remove_absolute(store.save_path)
	print("RESULT: ", checks, " checks / ", failures, " failures")
	call_deferred("quit", 1 if failures else 0)
