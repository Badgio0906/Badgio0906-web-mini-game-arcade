import type { AudioService } from '../../core/AudioService';
import type { Chapter } from './chargeTypes';
/** Quiet original three-voice chip motifs; scheduled only by active game time. */
export class ChargeMusic {
  private next = 0;
  private beat = 0;
  private chapter: Chapter = 'well';
  private audio: AudioService;
  constructor(audio: AudioService) { this.audio = audio; }
  update(dt: number, active: boolean, chapter: Chapter, charging: boolean): void {
    if (!active) { this.next = 0; return; }
    if (chapter !== this.chapter) { this.chapter = chapter; this.beat = 0; this.next = 0; }
    this.next -= dt;
    if (this.next > 0) return;
    this.next = chapter === 'well' ? .45 : chapter === 'sea' ? .33 : .38;
    const melody = chapter === 'well' ? [146.83,0,174.61,0,164.81,0,130.81,0] : chapter === 'space' ? [261.63,329.63,392,0,523.25,0,392,0] : [196,246.94,293.66,0,261.63,293.66,329.63,0];
    const note = melody[this.beat % melody.length];
    if (note && !charging) this.audio.tone(note, note, .16, 'triangle', 0, .006);
    if (this.beat % 4 === 0 && !charging) this.audio.tone(chapter === 'well' ? 73.42 : 98, chapter === 'well' ? 73.42 : 98, .2, 'triangle', 0, .004);
    this.beat++;
  }
}
