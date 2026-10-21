import { afterEach, describe, expect, it, vi } from 'vitest';
import { guardRotationActivation, PHONE_LANDSCAPE, watchPhoneLandscape } from '../../src/games/game015/portrait';

describe('Game015 portrait gate media lifecycle', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('initializes a landscape load, follows both rotations and removes its listener', () => {
    const media = Object.assign(new EventTarget(), { matches: true });
    const matchMedia = vi.fn(() => media);
    vi.stubGlobal('window', { matchMedia });
    const change = vi.fn(), stop = watchPhoneLandscape(change);
    expect(matchMedia).toHaveBeenCalledWith(PHONE_LANDSCAPE);
    expect(change.mock.calls).toEqual([[true]]);
    media.matches = false; media.dispatchEvent(new Event('change'));
    media.matches = true; media.dispatchEvent(new Event('change'));
    expect(change.mock.calls).toEqual([[true], [false], [true]]);
    stop(); media.matches = false; media.dispatchEvent(new Event('change'));
    expect(change).toHaveBeenCalledTimes(3);
  });
  it('allows an initially exempt device without requiring an orientation lock API', () => {
    vi.stubGlobal('window', { matchMedia: () => Object.assign(new EventTarget(), { matches: false }) });
    const change = vi.fn(), stop = watchPhoneLandscape(change);
    expect(change).toHaveBeenCalledExactlyOnceWith(false); stop();
  });
});

describe('Game015 keyboard gestures spanning rotation', () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each(['Enter', ' '])('requires release before a new %j activation, then cleans up', key => {
    const target = new EventTarget(), abort = new AbortController();
    vi.stubGlobal('window', target);
    const rotate = guardRotationActivation(abort.signal);
    const send = (type: string, repeat = false): Event => {
      const e = Object.assign(new Event(type, { cancelable: true }), { key, repeat }); target.dispatchEvent(e); return e;
    };
    expect(send('keydown').defaultPrevented).toBe(false);
    rotate(); rotate();
    expect(send('keydown', true).defaultPrevented).toBe(true);
    expect(send('keyup').defaultPrevented).toBe(true);
    expect(send('keydown').defaultPrevented).toBe(false);
    expect(send('keyup').defaultPrevented).toBe(false);
    expect(send('keydown').defaultPrevented).toBe(false); rotate();
    abort.abort(); expect(send('keyup').defaultPrevented).toBe(false);
  });
});
