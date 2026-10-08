import { afterEach, describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { applySurfaceShader, makeSurfaceArray, surfacePath, SurfaceTextures, SURFACE_KEYS, type PixelSurface, type SurfaceDecoder, type SurfaceTier } from '../../src/games/game031/SurfaceTextures';

function surface(size: number, id: number): PixelSurface {
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([id, id + 20, id + 40, 255], i);
  return { width: size, height: size, pixels, icon: `icon-${size}-${id}` };
}
const immediate: SurfaceDecoder = async url => {
  const id = SURFACE_KEYS.findIndex(key => url.endsWith(`/${key}.webp`)) + 1;
  return surface(url.includes('/light/') ? 256 : 512, id);
};
function deferredDecoder() {
  const requests: { url: string; signal: AbortSignal; resolve: (value: PixelSurface) => void; reject: (reason?: unknown) => void }[] = [];
  const decode: SurfaceDecoder = (url, signal) => new Promise((resolve, reject) => requests.push({ url, signal, resolve, reject }));
  function complete(tier: SurfaceTier) {
    requests.filter(r => r.url.includes(`/${tier}/`)).forEach((r, i) => r.resolve(surface(tier === 'light' ? 256 : 512, i + 1)));
  }
  return { requests, decode, complete };
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Game031 supplied surface identity and GPU-layer isolation', () => {
  it('uses canonical ASCII paths with stable BlockID mapping; AIR/boundary cannot address user assets', () => {
    const names = ['moss_soil', 'earth', 'stone', 'chalk', 'deep_stone', 'blue_crystal', 'amber_ore', 'dark_crystal'];
    for (let id = 1; id <= 8; id++) for (const tier of ['light', 'standard'] as const) {
      expect(surfacePath(id, tier)).toBe(`${import.meta.env.BASE_URL}assets/game031/textures-a/v1/${tier}/${names[id - 1]}.webp`);
    }
    for (const id of [-1, 0, 9, 10, 1.5, NaN, Infinity]) expect(() => surfacePath(id, 'standard')).toThrow('invalid_surface_id');
  });
  it('keeps all supplied pixels in their own BlockID layers and independently generates AIR/boundary', () => {
    const supplied = Array.from({ length: 8 }, (_, i) => surface(2, i + 1));
    const texture = makeSurfaceArray(2, supplied, 2);
    const data = texture.image.data;
    expect(texture.image.depth).toBe(10);
    for (let id = 1; id <= 8; id++) expect([...data.slice(id * 16, (id + 1) * 16)]).toEqual([...supplied[id - 1].pixels]);
    expect([...data.slice(9 * 16)]).not.toEqual([...supplied[7].pixels]);
    expect([...data.slice(0, 16)]).not.toEqual([...supplied[0].pixels]);
    texture.dispose();
  });
  it('uses sRGB base color, linear magnification, mipmaps, repeating per-layer UVs and bounded anisotropy configuration', () => {
    const texture = makeSurfaceArray(2, null, 2);
    expect(texture.isDataArrayTexture).toBe(true);
    expect(texture.colorSpace).toBe(T.SRGBColorSpace);
    expect(texture.magFilter).toBe(T.LinearFilter);
    expect(texture.minFilter).toBe(T.LinearMipmapNearestFilter);
    expect(texture.generateMipmaps).toBe(true);
    expect(texture.wrapS).toBe(T.RepeatWrapping);
    expect(texture.wrapT).toBe(T.RepeatWrapping);
    expect(texture.anisotropy).toBe(2);
    texture.dispose();
  });
  it('shares the same mutable array uniform between Basic and Lambert shader programs', () => {
    const textures = new SurfaceTextures('light', 4);
    for (const material of [new T.MeshBasicMaterial(), new T.MeshLambertMaterial()]) {
      applySurfaceShader(material, textures);
      const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>', fragmentShader: '#include <common>\n#include <map_fragment>' };
      material.onBeforeCompile(shader as unknown as T.WebGLProgramParametersWithUniforms, {} as T.WebGLRenderer);
      expect(shader.uniforms).toHaveProperty('blockSurfaces', textures.uniform);
      expect(shader.vertexShader).toContain('vSurface = vec3(surfaceUv, surfaceLayer)');
      expect(shader.fragmentShader).toContain('sampler2DArray');
      expect(shader.fragmentShader).toContain('texture(blockSurfaces, vSurface)');
      material.dispose();
    }
    textures.destroy();
  });
});

describe('Game031 asynchronous tier changes and failures', () => {
  it('starts with an explicit fallback and atomically switches all eight surfaces/icons', async () => {
    const { requests, decode, complete } = deferredDecoder();
    const textures = new SurfaceTextures('standard', 16, decode);
    const previous = textures.uniform.value;
    const disposed = vi.fn(); previous.addEventListener('dispose', disposed);
    expect(textures.state.status).toBe('fallback');
    const pending = textures.load('standard');
    expect(textures.state.status).toBe('loading');
    expect(requests).toHaveLength(8);
    requests[0].resolve(surface(512, 1));
    await Promise.resolve();
    expect(textures.uniform.value).toBe(previous);
    expect(textures.icons).toHaveLength(0);
    complete('standard'); await pending;
    expect(textures.state).toMatchObject({ status: 'supplied', activeTier: 'standard', suppliedCount: 8, size: 512 });
    expect(textures.icons).toHaveLength(8);
    // The standard tier may deliberately use 2..4 depending on profiling;
    // neither policy may request an unbounded hardware maximum.
    expect(textures.uniform.value.anisotropy).toBeGreaterThanOrEqual(1);
    expect(textures.uniform.value.anisotropy).toBeLessThanOrEqual(4);
    expect(disposed).toHaveBeenCalledTimes(1);
    expect(textures.state.gpuBytesEstimate).toBe(Math.ceil(512 * 512 * 4 * 10 * 4 / 3));
    textures.destroy();
  });
  it('deduplicates an identical in-flight or already-complete tier', async () => {
    const { requests, decode, complete } = deferredDecoder();
    const textures = new SurfaceTextures('light', 1, decode);
    const pending = textures.load('light');
    await textures.load('light'); expect(requests).toHaveLength(8);
    complete('light'); await pending;
    await textures.load('light'); expect(requests).toHaveLength(8);
    expect(textures.uniform.value.anisotropy).toBe(1);
    textures.destroy();
  });
  it('ignores an older successful decode which arrives after a newer tier has won', async () => {
    const { requests, decode, complete } = deferredDecoder();
    const textures = new SurfaceTextures('standard', 4, decode);
    const old = textures.load('standard');
    const newest = textures.load('light');
    expect(requests.slice(0, 8).every(r => r.signal.aborted)).toBe(true);
    complete('light'); await newest;
    const installed = textures.uniform.value;
    complete('standard'); await old; // deliberately emulate a decoder that ignores abort
    expect(textures.uniform.value).toBe(installed);
    expect(textures.state).toMatchObject({ requestedTier: 'light', activeTier: 'light', size: 256 });
    textures.destroy();
  });
  it('cancels a pending change when switching back to the current complete tier', async () => {
    const { requests, decode, complete } = deferredDecoder();
    const textures = new SurfaceTextures('light', 4, decode);
    const first = textures.load('light'); complete('light'); await first;
    const current = textures.uniform.value;
    const other = textures.load('standard');
    await textures.load('light');
    expect(requests.slice(8).every(r => r.signal.aborted)).toBe(true);
    complete('standard'); await other;
    expect(textures.uniform.value).toBe(current);
    expect(textures.state.status).toBe('supplied');
    expect(textures.state.requestedTier).toBe('light');
    textures.destroy();
  });
  it('retains the previous complete texture if a requested tier has a network/decode failure', async () => {
    let failure = false;
    const decoder: SurfaceDecoder = async (url, signal) => {
      if (failure && url.endsWith('/chalk.webp')) throw new Error('sensitive URL/server error should not be exposed');
      return immediate(url, signal);
    };
    const textures = new SurfaceTextures('light', 4, decoder);
    await textures.load('light'); const previous = textures.uniform.value;
    const disposed = vi.fn(); previous.addEventListener('dispose', disposed);
    const icons = textures.icons;
    failure = true; await textures.load('standard');
    expect(textures.uniform.value).toBe(previous);
    expect(textures.icons).toBe(icons);
    expect(textures.state).toMatchObject({ status: 'error', activeTier: 'light', requestedTier: 'standard', errors: ['4:load_failed'] });
    expect(disposed).not.toHaveBeenCalled();
    textures.destroy();
  });
  it.each(['width', 'height', 'pixels'] as const)('rejects incompatible %s without partial texture installation', async field => {
    const decoder: SurfaceDecoder = async (url, signal) => {
      const value = await immediate(url, signal);
      if (url.endsWith('/stone.webp')) {
        if (field === 'pixels') value.pixels = new Uint8ClampedArray(3);
        else value[field] = 128;
      }
      return value;
    };
    const textures = new SurfaceTextures('light', 2, decoder);
    const fallback = textures.uniform.value;
    await textures.load('light');
    expect(textures.uniform.value).toBe(fallback);
    expect(textures.state).toMatchObject({ status: 'fallback', suppliedCount: 0, errors: ['3:invalid_dimensions'] });
    textures.destroy();
  });
  it('aborts slow loading after eight seconds without infinite retry or replacing the current fallback', async () => {
    vi.useFakeTimers();
    const requests: AbortSignal[] = [];
    const decode: SurfaceDecoder = (_url, signal) => new Promise((_resolve, reject) => {
      requests.push(signal);
      signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    });
    const textures = new SurfaceTextures('light', 2, decode);
    const previous = textures.uniform.value;
    const pending = textures.load('light');
    await vi.advanceTimersByTimeAsync(8000); await pending;
    expect(requests).toHaveLength(8);
    expect(requests.every(s => s.aborted)).toBe(true);
    expect(textures.uniform.value).toBe(previous);
    expect(textures.state.status).toBe('fallback');
    expect(textures.state.errors).toHaveLength(8);
    textures.destroy();
  });
  it('disposes each replaced texture once and releases the current one on an idempotent destroy', async () => {
    const textures = new SurfaceTextures('light', 4, immediate);
    const counts = [vi.fn(), vi.fn(), vi.fn()];
    textures.uniform.value.addEventListener('dispose', counts[0]);
    await textures.load('light'); textures.uniform.value.addEventListener('dispose', counts[1]);
    await textures.load('standard'); textures.uniform.value.addEventListener('dispose', counts[2]);
    textures.destroy(); textures.destroy();
    for (const count of counts) expect(count).toHaveBeenCalledTimes(1);
    expect(textures.icons).toHaveLength(0);
  });
  it('does not mutate or notify destroyed materials when stale promises settle later', async () => {
    const { requests, decode, complete } = deferredDecoder();
    const textures = new SurfaceTextures('light', 4, decode);
    const onChange = vi.fn(); textures.onChange = onChange;
    const pending = textures.load('light');
    const previous = textures.uniform.value;
    textures.destroy();
    const notifications = onChange.mock.calls.length;
    expect(requests.every(r => r.signal.aborted)).toBe(true);
    complete('light'); await pending;
    expect(textures.uniform.value).toBe(previous);
    expect(textures.icons).toHaveLength(0);
    expect(onChange).toHaveBeenCalledTimes(notifications);
    await textures.load('standard'); expect(requests).toHaveLength(8);
  });
});
