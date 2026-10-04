import type { ElevatorChoice, ElevatorEvent, ElevatorInspection, ElevatorItem, ElevatorMode, ElevatorParty, ElevatorPassenger, ElevatorPhase, ElevatorResult, ElevatorSide, ElevatorSnapshot, OccupantKind } from './contracts';

export const CAPACITY_KG = 450;
export const DEPART_SECONDS = 0.4;
export const UNLOAD_SECONDS = 0.45;
export const OVERLOAD_WARNING_SECONDS = 0.65;
export const decisionSecondsAt = (floor: number, mode: ElevatorMode): number => mode === 'fast' ? Math.max(2, 3.2 - Math.max(0, floor - 20) * 0.035) : Math.max(4.5, 7 - Math.max(0, floor - 1) * 0.055);
export const travelSecondsFor = (mode: ElevatorMode): number => mode === 'fast' ? 0.58 : 1.15;
export const scoreMultiplierFor = (mode: ElevatorMode): 1 | 1.5 => mode === 'fast' ? 1.5 : 1;
const copyParty = <T extends ElevatorParty>(p: T): T => ({ ...p, items: p.items.map(item => ({ ...item })) });
const labels: Record<OccupantKind, string> = { office: '会社員', courier: '配達員', visitor: '来客', plant: '巨大な観葉植物', copier: 'コピー機', fridge: 'なぜか冷蔵庫', boxes: '段ボール台車' };
const item = (kind: OccupantKind, kg: number): ElevatorItem => ({ kind, label: labels[kind], kg,
  people: ['office', 'courier', 'visitor'].includes(kind) ? 1 : 0, cargo: kind === 'boxes' ? 4 : ['plant', 'copier', 'fridge'].includes(kind) ? 1 : 0,
  value: { office: 100, courier: 100, visitor: 110, boxes: 160, plant: 300, copier: 340, fridge: 400 }[kind] });

/** NEXT is an already-created real party. RNG is consumed only once when its future floor is queued. */
export function createElevatorParty(floor: number, random: () => number = Math.random): ElevatorParty {
  let items: ElevatorItem[]; let destination: number;
  if (floor === 1) { items = [item('office', 65)]; destination = 4; }
  else if (floor === 2) { items = [item('visitor', 90)]; destination = 6; }
  else if (floor === 3) { items = [item('boxes', 240)]; destination = 9; }
  else if (floor === 4) { items = [item('courier', 85), item('plant', 220)]; destination = 6; }
  else {
    const roll = Math.max(0, Math.min(0.999999, random()));
    const kinds: OccupantKind[] = floor < 8 ? ['office', 'courier', 'visitor', 'boxes'] : floor < 14 ? ['office', 'courier', 'visitor', 'boxes', 'plant', 'copier'] : ['office', 'courier', 'visitor', 'boxes', 'plant', 'copier', 'fridge'];
    const kind = kinds[Math.floor(roll * kinds.length)];
    const variant = Math.min(3, Math.floor(random() * 4));
    const kg = { office: 60 + variant * 10, courier: 70 + variant * 10, visitor: 55 + variant * 10,
      boxes: 120 + variant * 30, plant: 170 + variant * 20, copier: 220 + variant * 20, fridge: 260 + variant * 20 }[kind];
    items = [item(kind, kg)];
    if (floor >= 12 && roll > 0.76 && kg <= 280) items.push(item('courier', 75));
    destination = floor + 2 + Math.min(4, Math.floor(random() * 5));
  }
  return { id: floor, floor, destination, label: items.map(i => i.label).join('＋'), kg: items.reduce((sum, i) => sum + i.kg, 0), value: items.reduce((sum, i) => sum + i.value, 0), items };
}

export class ElevatorRun {
  private floor = 1;
  private score = 0;
  private time = 0;
  private alive = false;
  private phase: ElevatorPhase = 'boarding';
  private mode: ElevatorMode = 'normal';
  private pending: 'floor20' | null = null;
  private offered = false;
  private phaseTime = 0;
  private load = 0;
  private currentParty: ElevatorParty;
  private nextParty: ElevatorParty;
  private aboard: ElevatorPassenger[] = [];
  private lastUnloaded: ElevatorPassenger[] = [];
  private lastSide: ElevatorSide | null = null;
  private deliveredPeople = 0;
  private deliveredCargo = 0;
  private refused = 0;
  private timedOut = 0;
  private occupiedFloors = 0;
  private kgFloors = 0;
  private travelLoad = 0;
  private ending: ElevatorResult | null = null;
  constructor(private readonly emit: (event: ElevatorEvent) => void = () => {}, private readonly random: () => number = Math.random) {
    this.currentParty = createElevatorParty(1); this.nextParty = createElevatorParty(2);
  }
  start(): void { this.reset(); this.alive = true; }
  reset(): void {
    this.floor = 1; this.score = this.time = this.phaseTime = this.load = 0; this.alive = false; this.phase = 'boarding'; this.mode = 'normal'; this.pending = null; this.offered = false;
    this.currentParty = createElevatorParty(1); this.nextParty = createElevatorParty(2); this.aboard.length = this.lastUnloaded.length = 0; this.lastSide = null;
    this.deliveredPeople = this.deliveredCargo = this.refused = this.timedOut = this.occupiedFloors = this.kgFloors = this.travelLoad = 0; this.ending = null;
  }
  input(side: ElevatorSide): boolean { return this.decide(side, false); }
  private decide(side: ElevatorSide, timedOut: boolean): boolean {
    if (!this.alive || this.pending || this.phase !== 'boarding' || (side !== 'refuse' && side !== 'accept')) return false;
    this.lastSide = side; this.lastUnloaded.length = 0;
    if (side === 'accept') {
      this.load += this.currentParty.kg; this.aboard.push({ ...copyParty(this.currentParty), boardedFloor: this.floor });
    } else { this.refused++; if (timedOut) this.timedOut++; }
    this.emit({ type: 'decision', side, party: copyParty(this.currentParty), timedOut });
    if (this.load > CAPACITY_KG) { this.finish(); return true; }
    this.travelLoad = this.load; this.phase = 'departing'; this.phaseTime = 0; return true;
  }
  choose(choice: ElevatorChoice): boolean {
    if (!this.alive || !this.pending || (choice !== 'normal' && choice !== 'fast')) return false;
    this.mode = choice; this.pending = null; this.phase = 'unloading'; this.phaseTime = 0;
    this.emit({ type: 'choice', milestone: 'floor20', choice }); return true;
  }
  step(seconds: number): void {
    if (!this.alive || this.pending || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(0.05, seconds);
    while (remaining > 1e-10 && this.alive && !this.pending) {
      const dt = Math.min(1 / 240, remaining); remaining -= dt; this.time += dt; this.phaseTime += dt;
      if (this.phase === 'boarding' && this.phaseTime >= decisionSecondsAt(this.floor, this.mode)) this.decide('refuse', true);
      else if (this.phase === 'departing' && this.phaseTime >= DEPART_SECONDS) { this.phase = 'travel'; this.phaseTime = 0; }
      else if (this.phase === 'travel' && this.phaseTime >= travelSecondsFor(this.mode)) this.arrive();
      else if (this.phase === 'unloading' && this.phaseTime >= UNLOAD_SECONDS) { this.phase = 'boarding'; this.phaseTime = 0; this.lastSide = null; }
    }
  }
  private arrive(): void {
    let floorPoints = 0;
    if (this.travelLoad > 0) {
      this.occupiedFloors++; this.kgFloors += this.travelLoad;
      floorPoints = Math.round((10 + Math.round(this.travelLoad / CAPACITY_KG * 20)) * scoreMultiplierFor(this.mode)); this.score += floorPoints;
    }
    this.floor++; this.emit({ type: 'floor', floor: this.floor, points: floorPoints });
    this.lastUnloaded = this.aboard.filter(p => p.destination <= this.floor);
    this.aboard = this.aboard.filter(p => p.destination > this.floor);
    this.load = this.aboard.reduce((sum, p) => sum + p.kg, 0);
    if (this.lastUnloaded.length) {
      const people = this.lastUnloaded.reduce((sum, p) => sum + p.items.reduce((n, i) => n + i.people, 0), 0);
      const cargo = this.lastUnloaded.reduce((sum, p) => sum + p.items.reduce((n, i) => n + i.cargo, 0), 0);
      const kg = this.lastUnloaded.reduce((sum, p) => sum + p.kg, 0);
      const points = Math.round(this.lastUnloaded.reduce((sum, p) => sum + p.value, 0) * scoreMultiplierFor(this.mode));
      this.deliveredPeople += people; this.deliveredCargo += cargo; this.score += points;
      this.emit({ type: 'delivery', people, cargo, kg, points });
    }
    this.currentParty = this.nextParty; this.nextParty = createElevatorParty(this.floor + 1, this.random);
    this.phase = 'unloading'; this.phaseTime = 0;
    if (this.floor === 20 && !this.offered) {
      this.offered = true; this.pending = 'floor20'; this.phase = 'choice'; this.emit({ type: 'milestone', milestone: 'floor20' });
    }
  }
  /** Capacity violation is terminal at the actual boarding action, not after warning animation. */
  private finish(): void {
    if (!this.alive) return;
    this.alive = false; this.phase = 'overload'; this.phaseTime = 0;
    this.ending = { floor: this.floor, score: this.score, time: this.time, mode: this.mode, deliveredPeople: this.deliveredPeople,
      deliveredCargo: this.deliveredCargo, utilization: this.utilization(), occupiedFloors: this.occupiedFloors, refused: this.refused, timedOut: this.timedOut,
      outcome: 'overload', reason: `重量オーバー！ ${this.load}kg / ${CAPACITY_KG}kg（${this.load - CAPACITY_KG}kg 超過）`, load: this.load, excessKg: this.load - CAPACITY_KG, party: copyParty(this.currentParty) };
    this.emit({ type: 'overload', excessKg: this.load - CAPACITY_KG });
  }
  private utilization(): number { return this.occupiedFloors ? this.kgFloors / (CAPACITY_KG * this.occupiedFloors) * 100 : 0; }
  snapshot(): ElevatorSnapshot {
    const destination = this.aboard.length ? Math.min(...this.aboard.map(p => p.destination)) : null;
    const next = this.aboard.filter(p => p.destination === destination);
    return { floor: this.floor, score: this.score, time: this.time, alive: this.alive, phase: this.phase, pending: this.pending, mode: this.mode,
      scoreMultiplier: scoreMultiplierFor(this.mode), load: this.load, capacity: CAPACITY_KG, currentParty: copyParty(this.currentParty), nextParty: copyParty(this.nextParty),
      aboard: this.aboard.map(p => copyParty(p)), nextUnload: destination === null ? null : { floor: destination, kg: next.reduce((sum, p) => sum + p.kg, 0),
        people: next.reduce((sum, p) => sum + p.items.reduce((n, i) => n + i.people, 0), 0), cargo: next.reduce((sum, p) => sum + p.items.reduce((n, i) => n + i.cargo, 0), 0) },
      deliveredPeople: this.deliveredPeople, deliveredCargo: this.deliveredCargo, refused: this.refused, timedOut: this.timedOut, utilization: this.utilization(), occupiedFloors: this.occupiedFloors,
      decisionRemaining: this.phase === 'boarding' ? Math.max(0, decisionSecondsAt(this.floor, this.mode) - this.phaseTime) : 0,
      decisionSeconds: decisionSecondsAt(this.floor, this.mode), travelSeconds: travelSecondsFor(this.mode), lastSide: this.lastSide,
      lastUnloaded: this.lastUnloaded.map(p => copyParty(p)), excessKg: Math.max(0, this.load - CAPACITY_KG) };
  }
  result(): ElevatorResult | null { return this.ending ? { ...this.ending, party: copyParty(this.ending.party) } : null; }
  inspection(): ElevatorInspection {
    const doorOpen = this.phase === 'departing' ? Math.max(0, 1 - this.phaseTime / DEPART_SECONDS) : this.phase === 'travel' ? 0 : this.phase === 'unloading' ? Math.min(1, this.phaseTime / UNLOAD_SECONDS) : 1;
    return { ...this.snapshot(), phaseTime: this.phaseTime, doorOpen, travelProgress: this.phase === 'travel' ? Math.min(1, this.phaseTime / travelSecondsFor(this.mode)) : 0 };
  }
}
