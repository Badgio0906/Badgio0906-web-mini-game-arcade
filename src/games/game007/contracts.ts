export type ElevatorSide = 'refuse' | 'accept';
export type ElevatorChoice = 'normal' | 'fast';
export type ElevatorMode = 'normal' | 'fast';
export type ElevatorPhase = 'boarding' | 'departing' | 'travel' | 'unloading' | 'choice' | 'overload';
export type OccupantKind = 'office' | 'courier' | 'visitor' | 'plant' | 'copier' | 'fridge' | 'boxes';
export interface ElevatorItem { kind: OccupantKind; label: string; kg: number; people: number; cargo: number; value: number }
export interface ElevatorParty { id: number; floor: number; destination: number; label: string; kg: number; value: number; items: ElevatorItem[] }
export interface ElevatorPassenger extends ElevatorParty { boardedFloor: number }
export interface ElevatorSnapshot {
  floor: number; score: number; time: number; alive: boolean; phase: ElevatorPhase;
  pending: 'floor20' | null; mode: ElevatorMode; scoreMultiplier: 1 | 1.5;
  load: number; capacity: number; currentParty: ElevatorParty; nextParty: ElevatorParty;
  aboard: ElevatorPassenger[]; nextUnload: { floor: number; kg: number; people: number; cargo: number } | null;
  deliveredPeople: number; deliveredCargo: number; refused: number; timedOut: number;
  utilization: number; occupiedFloors: number; decisionRemaining: number; decisionSeconds: number;
  travelSeconds: number; lastSide: ElevatorSide | null; lastUnloaded: ElevatorPassenger[]; excessKg: number;
}
export interface ElevatorResult {
  floor: number; score: number; time: number; mode: ElevatorMode; deliveredPeople: number; deliveredCargo: number;
  utilization: number; occupiedFloors: number; refused: number; timedOut: number;
  outcome: 'overload'; reason: string; load: number; excessKg: number; party: ElevatorParty;
}
export type ElevatorEvent =
  | { type: 'decision'; side: ElevatorSide; party: ElevatorParty; timedOut: boolean }
  | { type: 'floor'; floor: number; points: number }
  | { type: 'delivery'; people: number; cargo: number; kg: number; points: number }
  | { type: 'overload'; excessKg: number }
  | { type: 'milestone'; milestone: 'floor20' }
  | { type: 'choice'; milestone: 'floor20'; choice: ElevatorChoice };
export interface ElevatorInspection extends ElevatorSnapshot { phaseTime: number; doorOpen: number; travelProgress: number }
export interface ElevatorHooks {
  onUpdate: (snapshot: ElevatorSnapshot) => void; onEnd: (result: ElevatorResult) => void; onEvent: (event: ElevatorEvent) => void;
}
export interface ElevatorController {
  start: () => void; title: () => void; input: (side: ElevatorSide) => boolean; choose: (choice: ElevatorChoice) => boolean;
  pause: (value: boolean) => void; snapshot: () => ElevatorSnapshot; inspection: () => ElevatorInspection; destroy: () => void;
}
