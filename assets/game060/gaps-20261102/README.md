# Game060 GAPS sound sources

Thirteen original procedural effects for 「雷、予約しました。」. Produced with the installed local GAPS engine on 2026-11-02. No third-party recordings, external audio generation APIs, or paid generation services were used.

`requests/` retains each deterministic recipe and seed. `exports/` retains the actual GAPS Web export manifests, recursive provenance and objective QA. `selected.json` maps the chosen asset IDs to the distributed PCM16/48kHz WAVs in `public/assets/game060/gaps-20261102/`. `repeatability.json` records a second CLI render of every recipe: all thirteen content IDs match.

Each provenance entry is `GAPS-procedural`, verified and permits redistribution. The user's request authorizes production selection; human listening and physical-device speaker acceptance remain unverified.

To reproduce, set `GAPS_ROOT` to an installed GAPS checkout and run:

```sh
python tools/generate-game060-gaps.py --gaps-root <GAPS_ROOT> --work-dir <new-empty-work-directory>
```

The tool invokes that checkout's virtual environment and never replaces an existing GAPS export package. Runtime library/exports are kept outside tracked source by default in `artifacts/game060-gaps/`. GAPS itself is not required on the deployed website.
