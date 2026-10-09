extends SceneTree

class FakeEndpoint:
	extends RefCounted
	var calls: Array = []
	var result: Variant = "20b026c8-79dc-4f2b-9e60-f0568e8371f7"
	func legacyBest(game_id: String, value: int) -> void:
		calls.append(["legacyBest", game_id, value])
	func startRun(game_id: String, ruleset_id: String, mode_id: String, practice: bool) -> Variant:
		calls.append(["startRun", game_id, ruleset_id, mode_id, practice])
		return result
	func finishRun(game_id: String, result_id: String, ruleset_id: String, mode_id: String, value: int, practice: bool) -> void:
		calls.append(["finishRun", game_id, result_id, ruleset_id, mode_id, value, practice])

	func cancelRun(game_id: String) -> void:
		calls.append(["cancelRun", game_id])

class TestAdapter:
	extends "res://scripts/RecordBridge.gd"
	var endpoint: Object
	func _interface() -> Object:
		return endpoint

var failures := 0
var main: Node
func check(condition: bool, message: String) -> void:
	if condition:
		print("PASS: ", message)
	else:
		push_error("FAIL: " + message)
		failures += 1

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var native := preload("res://scripts/RecordBridge.gd").new()
	check(native.start_run("game012") == "", "Absent web bridge is optional in native build")
	native.legacy_best("game012", 500)
	native.finish_run("game012", "", 500)
	native.cancel_run("game012")
	var endpoint := FakeEndpoint.new()
	var adapter := TestAdapter.new()
	adapter.endpoint = endpoint
	adapter.legacy_best("game012", -2)
	adapter.finish_run("game012", "", 500)
	check(endpoint.calls.is_empty(), "Invalid legacy value and absent RUN identity do not bridge")
	adapter.legacy_best("game012", 0)
	check(endpoint.calls[0] == ["legacyBest", "game012", 0], "Genuine saved zero is mirrored as a primitive")
	var result_id := adapter.start_run("game012")
	check(result_id == endpoint.result, "JS minted identity retained without native replacement")
	check(endpoint.calls[1] == ["startRun", "game012", "1", "normal", false], "Normal RUN metadata remains primitive")
	adapter.finish_run("game012", result_id, 500)
	check(endpoint.calls[2] == ["finishRun", "game012", result_id, "1", "normal", 500, false], "Final result forwards retained identity and score")
	endpoint.result = null
	check(adapter.start_run("game012") == "", "Invalid optional bridge response does not block native play")
	adapter.legacy_best("game012", -1)
	check(endpoint.calls[-1] == ["legacyBest", "game012", -1], "Missing native save has an explicit sentinel, distinct from zero")
	adapter.cancel_run("game012")
	check(endpoint.calls[-1] == ["cancelRun", "game012"], "Shared cancellation stays primitive and cannot finalize a RUN")
	main = load("res://scenes/Main.tscn").instantiate()
	root.add_child(main)
	await process_frame
	var game: GameManager = main.get_node("Game")
	game.scores.save_path = "user://test_bridge_high_score.cfg"
	game.record_bridge = adapter
	endpoint.result = "20b026c8-79dc-4f2b-9e60-f0568e8371f7"
	endpoint.calls.clear()
	game.start_game()
	check(endpoint.calls.size() == 1 and endpoint.calls[0][0] == "startRun", "One native start creates one bridge identity")
	game.score = 100
	game._record_and_tune()
	check(endpoint.calls.size() == 1, "Intermediate original save does not submit a final result")
	game._finish_game()
	check(endpoint.calls.size() == 2 and endpoint.calls[1][0] == "finishRun", "Native game_finished submits one final result")
	game.game_finished.emit(game.score, game.scores.high_score, false)
	check(endpoint.calls.size() == 2, "Repeated final signal cannot submit the same RUN twice")
	game.start_game()
	check(endpoint.calls.size() == 3 and not game.record_finished, "Retry resets finalization without altering original BEST")
	game.target.active = false
	for player in game.get_node("Audio").get_children(): player.stop()
	await create_timer(0.2).timeout
	DirAccess.remove_absolute(game.scores.save_path)
	main.queue_free()
	await process_frame
	print("RESULT: ", "ALL TESTS PASSED" if failures == 0 else str(failures) + " FAILED")
	call_deferred("quit", 1 if failures else 0)
