import type { ElevatorChoice, ElevatorEvent, ElevatorInspection, ElevatorParty, ElevatorPassenger, ElevatorPhase, ElevatorResult, ElevatorSide, ElevatorSnapshot } from './contracts';
import { floorParties } from './scenarios';
export const CAPACITY_KG = 450;
export const BOARD_SECONDS = .7, SKIP_SECONDS = .2, DEPART_SECONDS = .4, TRAVEL_SECONDS = 1, UNLOAD_SECONDS = .8;
export const RUN_SECONDS = 65, ROOF_SECONDS = 28, SPECIAL_SCORE = 1600;
const copy = <T extends ElevatorParty>(party: T): T => ({ ...party, items: party.items.map(item => ({ ...item })) });
export class ElevatorRun {
  private floor = 1; private score = 0; private time = 0; private segmentTime = 0; private limit = RUN_SECONDS;
  private alive = false; private phase: ElevatorPhase = 'boarding'; private phaseTime = 0; private duration = 0;
  private scenario = 0; private practice = false; private mode: 'normal' | 'roof' = 'normal'; private target = 10;
  private queue: ElevatorParty[] = []; private aboard: ElevatorPassenger[] = []; private lastUnloaded: ElevatorPassenger[] = [];
  private lastPoints = 0; private lastSide: ElevatorSide | null = null; private deliveredPeople = 0; private deliveredCargo = 0;
  private delivered = 0; private expired = 0; private refused = 0; private ending: ElevatorResult | null = null;
  constructor(private readonly emit: (event: ElevatorEvent) => void = () => {}) { this.reset(); }
  reset(scenario = 0, practice = false): void {
    this.floor = 1; this.score = this.time = this.segmentTime = this.phaseTime = 0; this.limit = practice ? 50 : RUN_SECONDS;
    this.alive = false; this.phase = 'boarding'; this.scenario = scenario; this.practice = practice; this.mode = 'normal'; this.target = practice ? 4 : 10;
    this.queue = floorParties(1, scenario, practice); this.aboard = []; this.lastUnloaded = []; this.lastPoints = 0; this.lastSide = null;
    this.deliveredPeople = this.deliveredCargo = this.delivered = this.expired = this.refused = 0; this.ending = null;
  }
  start(scenario = 0, practice = false): void { this.reset(scenario, practice); this.alive = true; }
  input(side: ElevatorSide): boolean {
    if (!this.alive || this.phase !== 'boarding') return false;
    if (side === 'depart') {
      const skipped = this.queue.length; this.refused += skipped;
      this.queue.forEach(party => this.emitDecision('refuse', party)); this.queue = [];
      this.emit({ type: 'departure', floor: this.floor, freeKg: CAPACITY_KG - this.load(), skipped });
      this.lastSide = side; this.change('departing', DEPART_SECONDS); return true;
    }
    const party = this.queue[0]; if (!party || (side !== 'accept' && side !== 'refuse') || (side === 'accept' && this.load() + party.kg > CAPACITY_KG)) return false;
    this.queue.shift(); this.lastSide = side;
    if (side === 'accept') this.aboard.push({ ...copy(party), boardedFloor: this.floor }); else this.refused++;
    this.emitDecision(side, party); this.change('action', side === 'accept' ? BOARD_SECONDS : SKIP_SECONDS); return true;
  }
  private emitDecision(side: ElevatorSide, p: ElevatorParty): void { this.emit({ type: 'decision', side, partyId: p.id, floor: this.floor, kg: p.kg, destination: p.destination, points: p.value, deadline: p.deadline, load: this.load() }); }
  private change(phase: ElevatorPhase, duration = 0): void { this.phase = phase; this.phaseTime = 0; this.duration = duration; }
  choose(choice: ElevatorChoice): boolean {
    if (!this.alive || this.phase !== 'choice' || !['finish', 'roof'].includes(choice)) return false;
    this.emit({ type: 'choice', choice });
    if (choice === 'finish') this.finish('complete');
    else { this.mode = 'roof'; this.target = 14; this.limit = ROOF_SECONDS; this.segmentTime = 0; this.queue = floorParties(10, this.scenario, false, true); this.change('boarding'); }
    return true;
  }
  step(seconds: number): void {
    if (!this.alive || this.phase === 'choice' || !Number.isFinite(seconds) || seconds <= 0) return;
    let left = Math.min(.05, seconds);
    while (left > 1e-10 && this.alive && (this.phase as ElevatorPhase) !== 'choice') {
      const dt = Math.min(1 / 240, left); left -= dt; this.time += dt; this.segmentTime += dt; this.phaseTime += dt;
      if (this.segmentTime >= this.limit - 1e-9) { this.finish('timeout'); break; }
      if (this.phase === 'action' && this.phaseTime >= this.duration - 1e-9) this.change('boarding');
      else if (this.phase === 'departing' && this.phaseTime >= DEPART_SECONDS - 1e-9) this.change('travel', TRAVEL_SECONDS);
      else if (this.phase === 'travel' && this.phaseTime >= TRAVEL_SECONDS - 1e-9) {
        this.floor++; this.emit({ type: 'floor', floor: this.floor }); this.lastUnloaded = this.aboard.filter(p => p.destination === this.floor); this.lastPoints = 0;
        if (this.lastUnloaded.length) this.change('unloading', UNLOAD_SECONDS); else this.arrived();
      } else if (this.phase === 'unloading' && this.phaseTime >= UNLOAD_SECONDS - 1e-9) {
        for (const p of this.lastUnloaded) {
          const onTime = p.deadline === null || this.segmentTime <= p.deadline + 1e-9; const points = onTime ? p.value : 0;
          this.score += points; this.lastPoints += points;
          if (onTime) { this.delivered++; this.deliveredPeople += p.items.reduce((n, i) => n + i.people, 0); this.deliveredCargo += p.items.reduce((n, i) => n + i.cargo, 0); } else this.expired++;
          this.emit({ type: 'delivery', floor: this.floor, partyId: p.id, kg: p.kg, points, onTime, deadline: p.deadline, time: this.segmentTime });
        }
        this.aboard = this.aboard.filter(p => p.destination !== this.floor); this.arrived();
      }
    }
  }
  private arrived(): void {
    if (this.floor >= this.target) {
      if (!this.practice && this.mode === 'normal' && this.score >= SPECIAL_SCORE) { this.change('choice'); this.emit({ type: 'special_offer', score: this.score }); }
      else this.finish('complete');
      return;
    }
    this.queue = floorParties(this.floor, this.scenario, this.practice, this.mode === 'roof'); this.lastSide = null; this.change('boarding');
  }
  private load(): number { return this.aboard.reduce((n, p) => n + p.kg, 0); }
  private finish(outcome: 'complete' | 'timeout'): void {
    this.alive = false; this.change('complete');
    this.ending = { floor: this.floor, score: this.score, time: this.time, mode: this.mode, deliveredPeople: this.deliveredPeople, deliveredCargo: this.deliveredCargo,
      delivered: this.delivered, expired: this.expired, refused: this.refused, outcome, reason: outcome === 'timeout' ? '時間切れ。届いた依頼だけ記録。' : '上昇便、お届け完了！', rulesVersion: 2 };
  }
  snapshot(): ElevatorSnapshot {
    const currentParty = this.queue[0] ? copy(this.queue[0]) : null;
    const destinations = this.aboard.map(p => p.destination); const nextFloor = destinations.length ? Math.min(...destinations) : null;
    const stops = currentParty ? new Set([...destinations.filter(d => d <= currentParty.destination), currentParty.destination]).size : 0;
    const minimumArrival = currentParty ? this.segmentTime + BOARD_SECONDS + (currentParty.destination - this.floor) * (DEPART_SECONDS + TRAVEL_SECONDS) + stops * UNLOAD_SECONDS : null;
    return { floor: this.floor, score: this.score, time: this.time, remaining: Math.max(0, this.limit - this.segmentTime), limit: this.limit, alive: this.alive, phase: this.phase,
      pending: this.phase === 'choice' ? 'roof' : null, mode: this.mode, rulesVersion: 2, scenario: this.scenario, target: this.target, load: this.load(), capacity: CAPACITY_KG,
      currentParty, queue: this.queue.map(copy), future: [this.floor + 1, this.floor + 2].filter(f => f < this.target).map(floor => ({ floor, parties: floorParties(floor, this.scenario, this.practice, this.mode === 'roof') })),
      aboard: this.aboard.map(copy), nextUnload: nextFloor === null ? null : { floor: nextFloor, kg: this.aboard.filter(p => p.destination === nextFloor).reduce((n, p) => n + p.kg, 0) }, nextStop: this.floor + 1,
      deliveredPeople: this.deliveredPeople, deliveredCargo: this.deliveredCargo, delivered: this.delivered, expired: this.expired, refused: this.refused,
      lastSide: this.lastSide, lastUnloaded: this.lastUnloaded.map(copy), lastPoints: this.lastPoints, minimumArrival };
  }
  inspection(): ElevatorInspection { return { ...this.snapshot(), phaseTime: this.phaseTime, doorOpen: this.phase === 'travel' ? 0 : this.phase === 'departing' ? Math.max(0, 1 - this.phaseTime / DEPART_SECONDS) : 1, travelProgress: this.phase === 'travel' ? this.phaseTime / TRAVEL_SECONDS : 0 }; }
  result(): ElevatorResult | null { return this.ending ? { ...this.ending } : null; }
}
