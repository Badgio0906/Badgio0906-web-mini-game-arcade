#!/usr/bin/env python3
"""Read selected source-line tokens from the pinned Godot GDSC v101 packages.

Read-only evidence aid, not a GDScript decompiler or gameplay execution test.
Requires the system libzstd. Does not write extracted scripts or package contents.
Unknown token types retain their numeric ID; no source text is invented.
"""
from __future__ import annotations

import argparse
import ctypes
import ctypes.util
import hashlib
from pathlib import Path
import struct
import sys

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools"))
from rename_legacy_titles import unpack  # Existing checksum-verifying PCK v3 reader.

GAMES = {
    "012": "yokodori-days",
    "013": "tachibana-task-heaven",
    "014": "finger-heart-challenge",
}
VECTOR_COMPONENTS = {5: 2, 6: 2, 7: 4, 8: 4, 9: 3, 10: 3, 11: 6,
                     12: 4, 13: 4, 14: 4, 15: 6, 16: 9, 17: 12,
                     18: 16, 19: 4, 20: 4}


def decode(raw: bytes) -> dict[int, list[str]]:
    if raw[:4] != b"GDSC" or struct.unpack_from("<I", raw, 4)[0] != 101:
        raise ValueError("Only the pinned GDSC v101 format is supported")
    size = struct.unpack_from("<I", raw, 8)[0]
    if not 16 <= size <= 2 * 1024 * 1024:
        raise ValueError("Unexpected token-buffer size")
    library = ctypes.util.find_library("zstd")
    if not library:
        raise RuntimeError("System libzstd is required")
    zstd = ctypes.CDLL(library)
    zstd.ZSTD_decompress.argtypes = [ctypes.c_void_p, ctypes.c_size_t,
                                    ctypes.c_char_p, ctypes.c_size_t]
    zstd.ZSTD_decompress.restype = ctypes.c_size_t
    out = ctypes.create_string_buffer(size)
    result = zstd.ZSTD_decompress(out, size, raw[12:], len(raw) - 12)
    if result != size:
        raise ValueError("Zstandard token-buffer size mismatch")
    buffer = out.raw
    identifier_count, constant_count, line_count, token_count = struct.unpack_from("<IIII", buffer)
    position = 16
    identifiers: list[str] = []
    for _ in range(identifier_count):
        length = struct.unpack_from("<I", buffer, position)[0]
        position += 4
        encoded = buffer[position:position + length * 4]
        if len(encoded) != length * 4:
            raise ValueError("Truncated identifier")
        identifiers.append(bytes(byte ^ 0xB6 for byte in encoded).decode("utf-32le"))
        position += length * 4
    constants: list[object] = []
    for _ in range(constant_count):
        variant = struct.unpack_from("<I", buffer, position)[0]
        position += 4
        kind = variant & 0xFFFF
        wide = bool(variant & (1 << 16))
        if kind == 0:
            value = None
        elif kind in (1, 2, 3):
            fmt = (("<q" if kind == 2 else "<d") if wide else
                   ("<f" if kind == 3 else "<i"))
            value = struct.unpack_from(fmt, buffer, position)[0]
            if kind == 1:
                value = bool(value)
            position += struct.calcsize(fmt)
        elif kind in (4, 21):
            length = struct.unpack_from("<I", buffer, position)[0]
            position += 4
            value = buffer[position:position + length].decode("utf-8")
            position += (length + 3) // 4 * 4
        elif kind in VECTOR_COMPONENTS:
            count = VECTOR_COMPONENTS[kind]
            value = ("variant", kind, struct.unpack_from("<" + "f" * count, buffer, position))
            position += count * 4
        else:
            raise ValueError(f"Unsupported Variant type {kind}")
        constants.append(value)
    # Two maps (line / column) each contain line_count uint32 pairs.
    position += line_count * 16
    if len(buffer) - position != token_count * 8:
        raise ValueError("Unexpected fixed-size token table")
    lines: dict[int, list[str]] = {}
    for index in range(token_count):
        token, source_line = struct.unpack_from("<II", buffer, position + index * 8)
        kind, data = token & 0x7F, token >> 8
        if kind == 2:
            value = identifiers[data]
        elif kind == 3:
            value = repr(constants[data])
        else:
            value = f"<token:{kind}>"
        lines.setdefault(source_line, []).append(value)
    return lines


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game", choices=GAMES, required=True)
    parser.add_argument("--script", required=True, help="Exact PCK key, e.g. scripts/game_manager.gdc")
    parser.add_argument("--lines", required=True, help="Selected original source lines, e.g. 6:10,125:130")
    args = parser.parse_args()
    selected: set[int] = set()
    for item in args.lines.split(","):
        span = [int(number) for number in item.split(":")]
        if len(span) not in (1, 2):
            parser.error("Use single lines or start:end ranges")
        start, end = span[0], span[-1]
        if start < 1 or end < start or end - start > 100:
            parser.error("Each range must contain at most 101 positive source lines")
        selected.update(range(start, end + 1))
    if len(selected) > 200:
        parser.error("Select at most 200 lines; full-script exports are unnecessary")
    package = ROOT / "public/games" / GAMES[args.game] / "index.pck"
    resources = unpack(package.read_bytes())
    if args.script not in resources or not args.script.endswith(".gdc"):
        parser.error("Select an existing .gdc resource")
    raw = resources[args.script]
    print(f"Game{args.game}: {package.relative_to(ROOT)} :: {args.script}")
    print(f"Resource SHA256: {hashlib.sha256(raw).hexdigest()}")
    print("Identifier/literal tokens only; all other types retain numeric token IDs.")
    for line, tokens in decode(raw).items():
        if line in selected:
            print(f"{line}: {' '.join(tokens)}")


if __name__ == "__main__":
    main()
