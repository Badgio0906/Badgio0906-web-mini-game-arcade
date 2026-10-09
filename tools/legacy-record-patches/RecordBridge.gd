# Optional primitive-only bridge. Original game saving and input do not depend on it.
extends RefCounted

func _interface() -> Object:
	if not OS.has_feature("web"):
		return null
	return JavaScriptBridge.get_interface("GAME100_RECORD_BRIDGE")

func legacy_best(game_id: String, value: int) -> void:
	if value < -1:
		return
	var bridge := _interface()
	if bridge != null:
		bridge.legacyBest(game_id, value)

func current_best(game_id: String, value: int) -> void:
	if value < -1:
		return
	var bridge := _interface()
	if bridge != null:
		bridge.currentBest(game_id, value)

func storage_error(game_id: String) -> void:
	var bridge := _interface()
	if bridge != null:
		bridge.storageError(game_id)

func start_run(game_id: String, ruleset_id: String = "1", mode_id: String = "normal") -> String:
	var bridge := _interface()
	if bridge == null:
		return ""
	var result: Variant = bridge.startRun(game_id, ruleset_id, mode_id, false)
	return result if result is String else ""

func finish_run(game_id: String, result_id: String, value: int, ruleset_id: String = "1", mode_id: String = "normal") -> void:
	if result_id.is_empty() or value < 0:
		return
	var bridge := _interface()
	if bridge != null:
		bridge.finishRun(game_id, result_id, ruleset_id, mode_id, value, false)

func cancel_run(game_id: String) -> void:
	var bridge := _interface()
	if bridge != null:
		bridge.cancelRun(game_id)
