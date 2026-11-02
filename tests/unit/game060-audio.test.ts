import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sfx } from '../../src/games/game060/audio';

class Node {
  gain = { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  frequency = { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  threshold = { value: 0 }; ratio = { value: 0 }; attack = { value: 0 }; release = { value: 0 };
  buffer: unknown = null;
  onended: (() => void) | null = null;
  started = false; stopped = false;
  connect() { return this; }
  disconnect() {}
  start() { this.started = true; }
  stop(when?: number) { if (when === undefined) this.stopped = true; }
}

class Context {
  static instances: Context[] = [];
  state = 'suspended'; currentTime = 0; sampleRate = 48000;
  destination = new Node(); sources: Node[] = [];
  decodeAudioData = vi.fn(async () => ({ duration: .2 }));
  constructor() { Context.instances.push(this); }
  createGain() { return new Node(); }
  createDynamicsCompressor() { return new Node(); }
  createBiquadFilter() { return new Node(); }
  createBuffer(_channels: number, length: number) { return { getChannelData: () => new Float32Array(length) }; }
  createBufferSource() { const n = new Node(); this.sources.push(n); return n; }
  createOscillator() { const n = new Node(); this.sources.push(n); return n; }
  async resume() { this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  async close() { this.state = 'closed'; }
}

const active = (c: Context) => c.sources.filter(s => s.started && !s.stopped && s.onended);
async function ready(c: Context) {
  await vi.waitFor(() => expect(c.decodeAudioData).toHaveBeenCalledTimes(13));
  await new Promise(resolve => setTimeout(resolve, 0));
}

beforeEach(() => {
  Context.instances = [];
  vi.stubGlobal('window', { AudioContext: Context });
  vi.stubGlobal('document', { baseURI: 'http://localhost/games/thunder_booking/index.html' });
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) })));
});
afterEach(() => vi.unstubAllGlobals());

describe('Game060 GAPS playback lifecycle', () => {
  it('preloads without creating an audio device and never replays events delayed by decoding', async () => {
    const s = new Sfx(); s.reserve();
    expect(Context.instances).toHaveLength(0);
    s.unlock(); const c = Context.instances[0];
    s.thunder(6); // Original synthesis is available while loading.
    expect(active(c).length).toBeGreaterThan(0);
    s.suspend();
    await ready(c);
    expect(active(c)).toHaveLength(0);
    s.resume();
    expect(active(c)).toHaveLength(0);
    s.thunder(6);
    expect(active(c)).toHaveLength(1);
    s.close();
  });

  it('mute stops playing and scheduled sources, suppresses events, and can be reversed', async () => {
    const s = new Sfx(); s.unlock(); const c = Context.instances[0]; await ready(c);
    s.fanfare(); expect(active(c)).toHaveLength(1);
    s.muted = true; expect(active(c)).toHaveLength(0);
    s.thunder(6); expect(active(c)).toHaveLength(0);
    s.muted = false; s.reserve(); expect(active(c)).toHaveLength(1);
    s.close();
  });

  it('caps all source nodes at ten and preserves high priority clear against slot notifications', async () => {
    const s = new Sfx(); s.unlock(); const c = Context.instances[0]; await ready(c);
    for (let i = 0; i < 30; i++) { c.currentTime += .02; s.thunder(6); }
    expect(active(c)).toHaveLength(10);
    c.currentTime += .02; s.fanfare();
    const clear = c.sources.at(-1)!;
    expect(active(c)).toHaveLength(10);
    c.currentTime += .1; s.slotReady();
    expect(clear.stopped).toBe(false);
    expect(active(c)).toHaveLength(10);
    s.stop(); expect(active(c)).toHaveLength(0);
    s.close();
  });

  it('falls back to the original synthesizer when sample requests fail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const s = new Sfx(); s.unlock(); const c = Context.instances[0];
    await new Promise(resolve => setTimeout(resolve, 0));
    s.reserve(); expect(active(c).length).toBeGreaterThan(0);
    s.muted = true; expect(active(c)).toHaveLength(0);
    s.close();
  });

  it('honors a fast explicit resume after an asynchronous suspension, without reviving a later pause', async () => {
    const s = new Sfx(); s.unlock(); const c = Context.instances[0]; await ready(c);
    const pending: (() => void)[] = [];
    vi.spyOn(c, 'suspend').mockImplementation(() => new Promise(resolve => {
      pending.push(() => { c.state = 'suspended'; resolve(); });
    }));
    s.suspend(); s.resume(); pending.shift()!();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(c.state).toBe('running');
    s.suspend(); s.resume(); s.suspend();
    for (const settle of pending) settle();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(c.state).toBe('suspended');
    expect(active(c)).toHaveLength(0);
    s.close();
  });

  it('cleans natural endings and ignores old callbacks after closing and reopening', async () => {
    const s = new Sfx(); s.unlock(); const first = Context.instances[0]; await ready(first);
    s.thunder(1); const source = first.sources.at(-1)!; const ended = source.onended!;
    ended(); expect(active(first)).toHaveLength(0);
    s.close(); s.unlock(); const second = Context.instances[1]; await ready(second);
    s.reserve(); ended();
    expect(active(second)).toHaveLength(1);
    expect(first.state).toBe('closed');
    s.close();
  });
});
