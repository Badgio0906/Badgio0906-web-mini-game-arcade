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
	store.save_path = "user://test_game014_current_records.cfg"
	DirAccess.remove_absolute(store.save_path)
	check(store.load_best("game014.normal.r1", 25).status == "missing", "No previous native BEST is distinct from zero")
	check(store.save_best("game014.normal.r1", 26, 25).status == "error", "Impossible success count cannot be stored")
	var endpoint := FakeEndpoint.new()
	var bridge := TestBridge.new()
	bridge.endpoint = endpoint
	var game = load("res://scenes/Main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	check(game.record_debug_excluded and game.record_result_id == "", "Original test-script mode is excluded from current records")
	check(game.game_state == game.GameState.RUNNING, "Original immediate start remains unchanged")
	game.record_bridge = bridge
	game.current_record_save = store
	game.record_debug_excluded = false
	game.reset_game()
	var first_id: String = game.record_result_id
	check(endpoint.calls.size() == 1 and endpoint.calls[0] == ["start", "game014", "1", "normal", false], "Actual native reset begins one primitive normal RUN")
	game.current_hand = game.HandType.FOX
	game.stop_hand()
	check(game.score == 0 and game.game_state == game.GameState.FAILED, "Original nonheart stop still fails at zero")
	check(endpoint.calls.size() == 2 and endpoint.calls[-1][5] == 0, "Genuine finalized zero is notified once")
	check(store.load_best("game014.normal.r1", 25).value == 0, "Genuine finalized zero has persistent native authority")
	game._finish(false)
	check(endpoint.calls.size() == 2, "Repeated native finish cannot duplicate a result")
	game.reset_game()
	check(game.record_result_id != first_id and not game.record_finished, "Retry creates a fresh RUN and resets finalization")
	var before := endpoint.calls.size()
	for index in range(25):
		game.current_hand = game.HandType.HEART
		game.stop_hand()
		check(game.score == index + 1, "Existing HEART scoring increments once at %d" % (index + 1))
		if index < 24:
			check(endpoint.calls.size() == before, "Intermediate HEART success is not a finalized result")
			game._resume()
	check(game.game_state == game.GameState.CLEARED and game.score == 25, "Unchanged five stages clear at total25")
	check(endpoint.calls[-1][5] == 25 and endpoint.calls.size() == before + 1, "Original clear forwards total success count once")
	check(store.load_best("game014.normal.r1", 25).value == 25, "Native clear BEST survives explicit reload")
	game.reset_game()
	game.current_hand = game.HandType.HEART
	game.stop_hand()
	game._resume()
	game.current_hand = game.HandType.PEACE
	game.stop_hand()
	check(endpoint.calls[-1][5] == 1 and store.load_best("game014.normal.r1", 25).value == 25, "Lower failed RUN does not regress native BEST")
	game.reset_game()
	before = endpoint.calls.size()
	game.reset_game()
	check(endpoint.calls.size() == before + 1 and endpoint.calls[-1][0] == "start", "Abandon/reset starts new RUN without inventing an old result")
	var cfg := ConfigFile.new()
	cfg.load(store.save_path)
	cfg.set_value("metadata", "schema", 2)
	cfg.save(store.save_path)
	var old_bytes := FileAccess.get_file_as_bytes(store.save_path)
	game.current_hand = game.HandType.FOX
	game.stop_hand()
	check(game.game_state == game.GameState.FAILED and endpoint.calls[-2] == ["error", "game014"], "Unsupported save schema reports storage error without stopping original result")
	check(FileAccess.get_file_as_bytes(store.save_path) == old_bytes, "Unsupported native save is not overwritten")
	check(store.load_best("game014.normal.r1", 25).status == "error", "Unsupported record is not misread as current")
	game.record_debug_excluded = true
	before = endpoint.calls.size()
	game.reset_game()
	game.current_hand = game.HandType.FOX
	game.stop_hand()
	check(endpoint.calls.size() == before, "Debug verification does not produce a current record")
	game.hand_timer.stop()
	game.result_timer.stop()
	game.queue_free()
	await process_frame
	DirAccess.remove_absolute(store.save_path)
	print("RESULT: ", checks, " checks / ", failures, " failures")
	call_deferred("quit", 1 if failures else 0)
