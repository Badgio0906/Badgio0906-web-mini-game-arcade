# Game031 voxel model (generator 1 / block definitions 1)

The model owns canonical voxel state independently of Three.js meshes. Dimensions are `{x,y,z}`; final dimensions are X128, Y64, Z128. Global indexing is `x + sizeX * (z + sizeZ * y)`. Chunk keys are `cx,cy,cz`; local indexing is `x + 16 * (z + 16 * y)`.

Generation eagerly allocates the deterministic base and mutable current voxel arrays before movement is enabled. Coordinate hashing depends on seed and integer coordinates, never chunk traversal order. The terrain has shallow surface/earth, stone, chalk and deep-rock layers, sparse coordinate-hashed crystals/ore and bounded small/medium/large cave volumes. A short passage beneath the ridge near the starting position provides a nearby exploration opening. Generator changes require a new version rather than silently altering saved terrain.

AIR is 0; placeable IDs 1–8 are fixed. BOUNDARY is 9 and cannot be collected, placed or edited. The bottom and outer X/Z walls are visible boundary material. A protected 3×3 return floor and three cells of headroom retain a safe return position. `protectedAt`, `referenceHeightFor` and `spawnFor` are pure helpers shared with backup validation.

World edits mutate canonical data immediately, increment world/chunk revisions and dirty only the edited chunk plus face-adjacent chunks when their faces meet the edit. Final-state changes are stored relative to the original base; restoring a voxel to its base ID removes its diff. `applyDiffs` validates the entire edit list before applying any mutation. Old meshing completion cannot clear a newer chunk revision.

The invisible player has a 0.6×1.8 voxel AABB with eye height 1.6, walking speed 4 voxel/s, gravity 16 voxel/s² and jump speed 6.6 voxel/s. Physics uses steps no longer than 1/120 s and caps recovered frame time at 0.1 s. X/Z/Y collision resolution uses voxel data and separate axis contact searches, allowing wall sliding. There is no fall damage, flight or visible player model.

Selection uses normalized voxel-grid ray traversal, nearest solid voxel and outward face normal, with a five-voxel reach. Mining resets on target/block change, release and explicit input reset; one update can remove at most one voxel. Placement recomputes the current target and validates material, stock, bounds, AIR, protected return space and player AABB before changing either world or inventory. User-placed crystals do not create new natural-material discovery types; found types are distinct material IDs, not repeated finds.

Tests and actual browser interaction are separate evidence. The first model run is retained at `QA/model-first.json`; follow-up results must use a different filename. Human play feel is not established by these model tests.

## Model test results

The final focused run passed 17/17 tests (`QA/model-final-01.json`). It compares every final-world voxel across two equal seeds, verifies all stable block IDs and bounded cave types, checks final-state diff round trips and stale chunk completion rejection, and exercises nearest-face selection, range, negative-direction chunk boundaries, mine/place conservation, target/release resets, low ceilings, full-height walls, wall sliding, hitch clamping, jumping onto a one-voxel step, feet mining followed by falling, body-overlap placement rejection including airborne state, stale displayed placement target revalidation and returning without inventory/world resets.

The first-run failed expectation used an origin 5.5 voxels above the surface with a 5-voxel ray reach. It was corrected to an origin 4.5 voxels above the surface; the production ray implementation was unchanged. The full deterministic traversal originally used over one million individual Vitest assertions and exceeded the default five-second case limit. An independent reviewer measured the same generation and plain comparisons with zero mismatches before the test was changed to one aggregate mismatch assertion; the first report remains intact. A separate exact-boundary comparison encountered JavaScript signed zero (`-0` versus `0`); numeric closeness is used for zero distance while coordinates and normal retain exact assertions. `QA/model-additional-first.json` retains that initial comparison result. These test harness changes are not presented as product physics fixes.

The repeated 100-cycle model test is synthetic unit evidence, not a human or browser-operated 100-block mining session. Actual PC/mobile input, rendering, load, IDB transactions and performance measurements are separate root QA responsibilities.
