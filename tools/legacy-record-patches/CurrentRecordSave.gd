# Native authority for versioned current records; original saves remain unchanged.
extends RefCounted

const SCHEMA := 1
var save_path := "user://game100_records_v1.cfg"

func _read_file() -> Dictionary:
	var cfg := ConfigFile.new()
	var error := cfg.load(save_path)
	if error == ERR_FILE_NOT_FOUND:
		cfg.set_value("metadata", "schema", SCHEMA)
		return {"status": "missing", "cfg": cfg}
	if error != OK or typeof(cfg.get_value("metadata", "schema", null)) != TYPE_INT or cfg.get_value("metadata", "schema", null) != SCHEMA:
		return {"status": "error"}
	return {"status": "ok", "cfg": cfg}

func load_best(section: String, maximum: int) -> Dictionary:
	var loaded := _read_file()
	if loaded.status == "error": return loaded
	var cfg: ConfigFile = loaded.cfg
	if not cfg.has_section_key(section, "best"):
		return {"status": "missing", "value": -1}
	var value: Variant = cfg.get_value(section, "best")
	if typeof(value) != TYPE_INT or value < 0 or value > maximum:
		return {"status": "error"}
	return {"status": "ok", "value": value}

func save_best(section: String, value: int, maximum: int) -> Dictionary:
	if value < 0 or value > maximum: return {"status": "error"}
	var loaded := _read_file()
	if loaded.status == "error": return loaded
	var cfg: ConfigFile = loaded.cfg
	var old: Variant = cfg.get_value(section, "best", -1)
	if typeof(old) != TYPE_INT or old < -1 or old > maximum:
		return {"status": "error"}
	var best := maxi(int(old), value)
	if best == old: return {"status": "ok", "value": best}
	cfg.set_value(section, "best", best)
	cfg.set_value(section, "updated_at", int(Time.get_unix_time_from_system()))
	# Write a complete replacement first. Failed writes leave the previous file intact.
	var pending := save_path + ".pending"
	if cfg.save(pending) != OK: return {"status": "error"}
	if DirAccess.rename_absolute(pending, save_path) != OK:
		DirAccess.remove_absolute(pending)
		return {"status": "error"}
	return {"status": "ok", "value": best}
