import { historicalGameCatalog as gameCatalog } from './gameCatalog.ts';
import type { TelemetryEvent } from './telemetrySchema.ts';

/** Summaries are restricted to the retained event window, never population claims. */
export function summarizeEvents(events: readonly TelemetryEvent[]) {
  const byGame = gameCatalog.map(game => {
    const rows = events.filter(event => event.data.game_id === game.id);
    const starts = rows.filter(event => event.name === 'run_start');
    const ends = rows.filter(event => event.name === 'run_end');
    const durations = ends.map(event => event.data.time ?? event.data.seconds).filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0);
    const phases = new Map<string, string>();
    const exitPhases: Record<string, number> = Object.create(null);
    const deathReasons: Record<string, number> = Object.create(null);
    const firstDeathLocations: { sessionId: string; reason: string; position: number | null; unit: string | null; phase: string | null }[] = [];
    const deadSessions = new Set<string>();
    for (const [index, event] of rows.entries()) {
      const session = String(event.data.session_id ?? 'unknown');
      if (event.name === 'phase_reached') phases.set(session, String(event.data.phase ?? 'unknown'));
      if (event.name === 'practice_start') phases.set(session, 'practice');
      if (event.name === 'tutorial_view' || event.name === 'tutorial_start') phases.set(session, 'explanation');
      if (event.name === 'run_start') phases.set(session, 'playing');
      if (event.name === 'page_exit' || (event.name === 'run_end' && event.data.outcome === 'quit')) {
        const phase = String(event.data.phase ?? phases.get(session) ?? 'unknown');
        // Only pair a nearby navigation quit. An earlier quit must not hide a later run's exit.
        const pairedQuit = event.name === 'page_exit' && rows.some((row, quitIndex) =>
          row.name === 'run_end' && row.data.outcome === 'quit' && row.data.session_id === session &&
          Math.abs(Date.parse(row.at) - Date.parse(event.at)) <= 1000 &&
          !rows.slice(Math.min(index, quitIndex) + 1, Math.max(index, quitIndex)).some(activity =>
            activity.data.session_id === session && ['run_start', 'practice_start', 'tutorial_start', 'tutorial_view'].includes(activity.name)));
        if (!pairedQuit) exitPhases[phase] = (exitPhases[phase] ?? 0) + 1;
      }
      const failure = event.name === 'death_reason' || (event.name === 'run_end' && event.data.outcome === 'over');
      if (failure) {
        const reason = String(event.data.reason ?? event.data.failure_reason ?? 'unknown');
        if (event.name === 'run_end' || !rows.some(row => row.name === 'run_end' && row.data.outcome === 'over' && row.data.session_id === session && row.data.runId === event.data.runId)) deathReasons[reason] = (deathReasons[reason] ?? 0) + 1;
        if (!deadSessions.has(session)) {
          deadSessions.add(session);
          const location = ['depth', 'height', 'distance', 'round', 'level'].find(key => typeof event.data[key] === 'number');
          firstDeathLocations.push({ sessionId: session, reason, position: location ? event.data[location] as number : null, unit: location ? (['depth','height','distance'].includes(location) ? 'meters' : location) : null, phase: typeof event.data.phase === 'string' ? event.data.phase : phases.get(session) ?? null });
        }
      }
    }
    return { gameId: game.id, status: game.status, difficulty: game.difficulty, tags: game.tags.map(tag => tag.id), sessions: new Set(rows.map(event => event.data.session_id).filter(Boolean)).size,
      opens: rows.filter(event => event.name === 'game_open').length, playCount: starts.length, completedRunCount: ends.filter(event => !['quit', 'restart'].includes(String(event.data.outcome))).length,
      averagePlaySeconds: durations.length ? durations.reduce((a,b) => a+b, 0) / durations.length : null, measuredDurationCount: durations.length,
      exitPhases, deathReasons, firstDeathLocations, measurementCoverage: game.releaseOrder >= 12 && game.releaseOrder <= 14 ? 'legacy-shell-only; game loop uninstrumented' : 'native events; fields differ by game; missing values unknown' };
  });
  const byTag = [...new Set(gameCatalog.flatMap(game => game.tags.map(tag => tag.id)))].map(tagId => ({ tagId, playCount: byGame.filter(game => game.tags.includes(tagId)).reduce((n, game) => n + game.playCount, 0) }));
  const byDifficulty = (['standard','rising','hard'] as const).map(difficulty => ({ difficulty, basis: 'catalog design assessment; not player feedback', playCount: byGame.filter(game => game.difficulty === difficulty).reduce((n, game) => n + game.playCount, 0) }));
  return { scope: 'retained-device-window', sampleEventCount: events.length, byGame, byTag, byDifficulty,
    interpretation: 'Tags overlap; counts are not unique players. Legacy run counts and unreported positions cannot be inferred. Difficulty response requires later human observations.' };
}
