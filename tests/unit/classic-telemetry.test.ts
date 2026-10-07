import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsRuntime } from '../../src/analytics/runtime';
import { TelemetryService } from '../../src/core/TelemetryService';

const RUN = '12345678-1234-4234-8234-123456789012';
function runtime() {
  const value = Object.create(AnalyticsRuntime.prototype) as AnalyticsRuntime;
  Object.assign(value, { consent: { getState: () => 'granted', subscribe: vi.fn() }, environment: 'production', attribution: {}, ga: { track: vi.fn() }, send: vi.fn(), persistLocal: () => false });
  return value;
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('optional classic game telemetry continuation', () => {
  it('restores an existing UUID without emitting another start or replacing a different active run', () => {
    const service = new TelemetryService(undefined, 'game021');
    const context = runtime().createContext('game021', 'test-page');
    Object.assign(service, { analyticsContext: context });
    expect(service.getActiveRunId()).toBeNull();
    expect(service.restoreRun('not-a-run')).toBe(false);
    expect(service.restoreRun(RUN)).toBe(true);
    expect(service.getActiveRunId()).toBe(RUN);
    expect(context.phase).toBe('playing');
    expect(service.getEvents()).toHaveLength(0);
    expect(service.restoreRun('22345678-1234-4234-8234-123456789012')).toBe(false);
    expect(service.restoreRun(RUN)).toBe(true);
  });
  it('does not invent a run when the optional observer is absent', () => {
    const service = new TelemetryService(undefined, 'game021');
    expect(service.restoreRun(RUN)).toBe(false);
    expect(service.getActiveRunId()).toBeNull();
  });
  it('links an explicitly resumed end to its original observer run, without an extra run_start', () => {
    const observer = runtime();
    const context = observer.createContext('game020', 'test-page');
    const service = new TelemetryService(undefined, 'game021');
    Object.assign(service, { analytics: observer, analyticsContext: context });
    expect(service.restoreRun(RUN)).toBe(true);
    service.trackEvent('run_end', { outcome: 'quit' });
    expect(service.getEvents().map(event => event.name)).toEqual(['run_end']);
    expect((observer as any).send).toHaveBeenCalledWith(expect.objectContaining({ run: RUN }), 'run_end', expect.any(Object));
  });
});
describe('pending Worker registration gate', () => {
  it('suppresses remote and GA calls even after consent while retaining the existing run UUID lifecycle', () => {
    const observer = runtime(), context = observer.createContext('game021', 'test-page');
    context.remoteCollectionEnabled = false;
    observer.record(context, { name: 'run_start', at: new Date().toISOString(), data: {} });
    expect(context.run).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i);
    observer.record(context, { name: 'specific_game_events', at: new Date().toISOString(), data: { event: 'disc_drop', column: 2 } });
    observer.record(context, { name: 'run_end', at: new Date().toISOString(), data: { outcome: 'win' } });
    expect(context.phase).toBe('result');
    expect((observer as any).send).not.toHaveBeenCalled();
    expect((observer as any).ga.track).not.toHaveBeenCalled();
  });
  it.each([undefined, true])('keeps the default existing-game behavior (%s)', enabled => {
    const observer = runtime(), context = observer.createContext('game020', 'test-page');
    context.remoteCollectionEnabled = enabled;
    observer.record(context, { name: 'run_start', at: new Date().toISOString(), data: {} });
    expect((observer as any).send).toHaveBeenCalledOnce();
    expect((observer as any).ga.track).toHaveBeenCalledOnce();
  });
  it.each(['game_card_impression', 'game_card_click', 'game_launch'] as const)('blocks pending Portal-selected IDs for %s, and preserves the registered game020 route', name => {
    const observer = runtime(), context = observer.createContext('portal', 'test-page');
    for (const selected_game of ['game021', 'game022', 'game023', 'game024', 'game025']) {
      observer.record(context, { name, at: new Date().toISOString(), data: { selected_game } });
    }
    expect((observer as any).send).not.toHaveBeenCalled();
    expect((observer as any).ga.track).not.toHaveBeenCalled();
    observer.record(context, { name, at: new Date().toISOString(), data: { selected_game: 'game020' } });
    expect((observer as any).send).toHaveBeenCalledOnce();
    expect((observer as any).ga.track).toHaveBeenCalledWith(name, 'game020', expect.anything());
  });
});
