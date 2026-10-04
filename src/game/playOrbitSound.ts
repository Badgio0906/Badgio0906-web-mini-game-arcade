import type { AudioService } from '../core/AudioService';
import type { GameplayEvent } from './contracts';

/** Orbit-specific sounds; the shared audio service knows no game's event types. */
export function playOrbitSound(audio: AudioService, event: GameplayEvent): void {
  switch (event.type) {
    case 'shift': audio.tone(300, 650, 0.09, 'sine', 0, 0.035); break;
    case 'shard': audio.tone(800, 1200, 0.12, 'sine'); audio.tone(1200, 1400, 0.1, 'sine', 0.06); break;
    case 'near_miss': {
      const pitch = 580 + event.combo * 110;
      audio.tone(pitch, pitch * 1.4, 0.16, 'triangle');
      if (event.combo > 1) audio.tone(pitch * 1.5, pitch * 2, 0.12, 'sine', 0.08);
      break;
    }
    case 'death': audio.tone(150, 35, 0.28, 'sawtooth', 0, 0.045); audio.tone(70, 30, 0.36, 'triangle', 0.025); break;
    case 'pass': break;
  }
}
