export type ElevatorSide = 'refuse' | 'accept' | 'depart';
export type ElevatorChoice = 'finish' | 'roof';
export type ElevatorPhase = 'boarding' | 'action' | 'departing' | 'travel' | 'unloading' | 'choice' | 'complete';
export type OccupantKind = 'office' | 'courier' | 'visitor' | 'plant' | 'copier' | 'fridge' | 'boxes';
export interface ElevatorItem { kind: OccupantKind; label: string; kg: number; people: number; cargo: number; value: number }
export interface ElevatorParty { id: number; floor: number; destination: number; label: string; kg: number; value: number; deadline: number | null; items: ElevatorItem[] }
export interface ElevatorPassenger extends ElevatorParty { boardedFloor: number }
export interface ElevatorSnapshot {
  floor: number; score: number; time: number; remaining: number; limit: number; alive: boolean; phase: ElevatorPhase; pending: 'roof' | null;
  mode: 'normal' | 'roof'; rulesVersion: 2; scenario: number; target: number; load: number; capacity: number;
  currentParty: ElevatorParty | null; queue: ElevatorParty[]; future: { floor: number; parties: ElevatorParty[] }[];
  aboard: ElevatorPassenger[]; nextUnload: { floor: number; kg: number } | null; nextStop: number;
  deliveredPeople: number; deliveredCargo: number; delivered: number; expired: number; refused: number;
  lastSide: ElevatorSide | null; lastUnloaded: ElevatorPassenger[]; lastPoints: number; minimumArrival: number | null;
}
export interface ElevatorInspection extends ElevatorSnapshot { phaseTime: number; doorOpen: number; travelProgress: number }
export interface ElevatorResult { floor: number; score: number; time: number; mode: 'normal' | 'roof'; deliveredPeople: number; deliveredCargo: number; delivered: number; expired: number; refused: number; outcome: 'complete' | 'timeout'; reason: string; rulesVersion: 2 }
export type ElevatorEvent = { type: 'decision'; side: ElevatorSide; partyId: number; floor: number; kg: number; destination: number; points: number; deadline: number | null; load: number }
  | { type: 'departure'; floor: number; freeKg: number; skipped: number }
  | { type: 'delivery'; floor: number; partyId: number; kg: number; points: number; onTime: boolean; deadline: number | null; time: number }
  | { type: 'floor'; floor: number } | { type: 'choice'; choice: ElevatorChoice } | { type: 'special_offer'; score: number };
export interface ElevatorHooks { onUpdate: (snapshot: ElevatorSnapshot) => void; onEnd: (result: ElevatorResult) => void; onEvent: (event: ElevatorEvent) => void }
export interface ElevatorController { start: (scenario?: number, practice?: boolean) => void; title: () => void; input: (side: ElevatorSide) => boolean; choose: (choice: ElevatorChoice) => boolean; pause: (value: boolean) => void; snapshot: () => ElevatorSnapshot; inspection: () => ElevatorInspection; destroy: () => void }
