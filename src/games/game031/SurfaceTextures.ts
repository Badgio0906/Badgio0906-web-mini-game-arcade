import * as T from 'three';
import { BLOCKS } from './Blocks';

export type SurfaceTier = 'light' | 'standard';
export const SURFACE_KEYS = ['moss_soil', 'earth', 'stone', 'chalk', 'deep_stone', 'blue_crystal', 'amber_ore', 'dark_crystal'] as const;
export const surfacePath = (id: number, tier: SurfaceTier): string => {
  if (!Number.isInteger(id) || id < 1 || id > 8) throw new Error('invalid_surface_id');
  return `${import.meta.env.BASE_URL}assets/game031/textures-a/v1/${tier}/${SURFACE_KEYS[id - 1]}.webp`;
};
export interface PixelSurface { width: number; height: number; pixels: Uint8ClampedArray; icon: string }
export type SurfaceDecoder = (url: string, signal: AbortSignal) => Promise<PixelSurface>;
export interface SurfaceState {
  status: 'loading' | 'supplied' | 'fallback' | 'error';
  requestedTier: SurfaceTier; activeTier: SurfaceTier | null;
  suppliedCount: number; errors: string[]; size: number; gpuBytesEstimate: number;
}

export const decodeSurface: SurfaceDecoder = async (url, signal) => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`http_${response.status}`);
  const blob = await response.blob();
  if (blob.size > 2 * 1024 * 1024) throw new Error('image_too_large');
  const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
  try {
    if (signal.aborted) throw new Error('aborted');
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    const pixels = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    const icon = document.createElement('canvas'); icon.width = icon.height = 48;
    icon.getContext('2d')!.drawImage(canvas, 0, 0, 48, 48);
    return { width: bitmap.width, height: bitmap.height, pixels, icon: icon.toDataURL('image/webp', .9) };
  } finally { bitmap.close(); }
};

// Independent array layers retain one material/draw per chunk, and the GPU
// generates/filter mip levels within each material, never across atlas slots.
export function makeSurfaceArray(size: number, supplied: readonly PixelSurface[] | null, anisotropy: number): T.DataArrayTexture {
  const data = new Uint8Array(size * size * 4 * 10);
  for (let id = 0; id < 10; id++) {
    const offset = id * size * size * 4;
    if (supplied && id >= 1 && id <= 8) { data.set(supplied[id - 1].pixels, offset); continue; }
    const color = BLOCKS[id].color;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = offset + (y * size + x) * 4;
      const shade = id === 9 ? ((Math.floor(x / (size / 4)) + Math.floor(y / (size / 4))) % 2 ? .76 : 1.15) : ((Math.imul(x + y * size + id * 997, 1597334677) >>> 0) % 9 === 0 ? .86 : 1);
      data[i] = Math.min(255, (color >> 16 & 255) * shade);
      data[i + 1] = Math.min(255, (color >> 8 & 255) * shade);
      data[i + 2] = Math.min(255, (color & 255) * shade); data[i + 3] = 255;
    }
  }
  const texture = new T.DataArrayTexture(data, size, size, 10);
  texture.colorSpace = T.SRGBColorSpace; texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapNearestFilter; texture.generateMipmaps = true;
  texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export class SurfaceTextures {
  readonly uniform: { value: T.DataArrayTexture };
  icons: readonly string[] = [];
  state: SurfaceState;
  private epoch = 0; private disposed = false; private pending: AbortController | null = null;
  private pendingTier: SurfaceTier | null = null;
  onChange: (() => void) | null = null;
  constructor(tier: SurfaceTier, private readonly maxAnisotropy: number, private readonly decode: SurfaceDecoder = decodeSurface) {
    this.uniform = { value: makeSurfaceArray(32, null, 1) };
    this.state = { status: 'fallback', requestedTier: tier, activeTier: null, suppliedCount: 0, errors: [], size: 32, gpuBytesEstimate: Math.ceil(32 * 32 * 4 * 10 * 4 / 3) };
  }
  async load(tier: SurfaceTier): Promise<void> {
    if (this.disposed || this.pendingTier === tier) return;
    // Switching back to an already active tier must also cancel an older load.
    this.pending?.abort(); this.pending = null; this.pendingTier = null;
    const epoch = ++this.epoch;
    if (this.state.activeTier === tier && this.state.suppliedCount === 8) {
      this.state = { ...this.state, status: 'supplied', requestedTier: tier, errors: [] }; this.onChange?.(); return;
    }
    const controller = new AbortController(); this.pending = controller; this.pendingTier = tier;
    const timeout = setTimeout(() => controller.abort(), 8000);
    this.state = { ...this.state, status: 'loading', requestedTier: tier, errors: [] }; this.onChange?.();
    try {
      const size = tier === 'light' ? 256 : 512;
      const results = await Promise.allSettled(SURFACE_KEYS.map((_, index) => this.decode(surfacePath(index + 1, tier), controller.signal)));
      if (this.disposed || epoch !== this.epoch) return;
      const errors: string[] = [];
      results.forEach((r, i) => {
        if (r.status === 'rejected') errors.push(`${i + 1}:load_failed`);
        else if (r.value.width !== size || r.value.height !== size || r.value.pixels.length !== size * size * 4) errors.push(`${i + 1}:invalid_dimensions`);
      });
      if (errors.length) {
        // Keep the previous complete supplied tier, or the explicit fallback.
        this.state = { ...this.state, status: this.state.suppliedCount === 8 ? 'error' : 'fallback', errors }; this.onChange?.(); return;
      }
      const surfaces = results.map(r => (r as PromiseFulfilledResult<PixelSurface>).value);
      const next = makeSurfaceArray(size, surfaces, Math.max(1, Math.min(this.maxAnisotropy, tier === 'light' ? 1 : 2)));
      const old = this.uniform.value; this.uniform.value = next; old.dispose();
      this.icons = surfaces.map(s => s.icon);
      this.state = { status: 'supplied', requestedTier: tier, activeTier: tier, suppliedCount: 8, errors: [], size, gpuBytesEstimate: Math.ceil(size * size * 4 * 10 * 4 / 3) }; this.onChange?.();
    } finally {
      clearTimeout(timeout);
      if (epoch === this.epoch) { this.pending = null; this.pendingTier = null; }
    }
  }
  destroy(): void { if (this.disposed) return; this.disposed = true; this.epoch++; this.pending?.abort(); this.pending = null; this.onChange = null; this.uniform.value.dispose(); this.icons = []; }
}

export function applySurfaceShader(material: T.MeshBasicMaterial | T.MeshStandardMaterial | T.MeshLambertMaterial, surfaces: SurfaceTextures): void {
  material.onBeforeCompile = shader => {
    shader.uniforms.blockSurfaces = surfaces.uniform;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 surfaceUv;\nattribute float surfaceLayer;\nvarying vec3 vSurface;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurface = vec3(surfaceUv, surfaceLayer);');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform highp sampler2DArray blockSurfaces;\nvarying vec3 vSurface;')
      .replace('#include <map_fragment>', 'diffuseColor *= texture(blockSurfaces, vSurface);');
  };
  material.customProgramCacheKey = () => 'game031-surface-array-v1';
}
