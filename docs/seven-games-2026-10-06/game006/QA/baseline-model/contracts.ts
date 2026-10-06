export type ParkingPhase = 'angle' | 'power' | 'driving' | 'parked' | 'choice' | 'ended';
export type ParkingChoice = 'normal' | 'forbidden';
export type ParkingMode = 'normal' | 'forbidden';
export type ParkingGrade = 'GOOD' | 'GREAT' | 'PERFECT PARK';
export type ParkingOutcome = 'collision' | 'outside';
export interface Point { x: number; y: number }
export interface ParkingPose extends Point { rotation: number; width: number; height: number }
export interface ParkingObstacle extends ParkingPose { id: number; kind: 'car' | 'curb'; variant: number }
export interface ParkingLayout {
  id: number; templateId: string; name: string; start: ParkingPose; slot: ParkingPose;
  obstacles: ParkingObstacle[]; variant: number;
}
export interface ParkingSnapshot {
  score: number; parked: number; perfectCount: number; perfectStreak: number; maxStreak: number;
  time: number; alive: boolean; phase: ParkingPhase; pending: 'forbidden' | null; mode: ParkingMode;
  steeringDegrees: number; power: number; lockedSteering: number | null; lockedPower: number | null;
  grade: ParkingGrade | null; pose: ParkingPose; streakMultiplier: number; modeMultiplier: number;
  outcome: ParkingOutcome | null;
}
export interface ParkingResult {
  score: number; parked: number; perfectCount: number; maxStreak: number; time: number; mode: ParkingMode;
  outcome: ParkingOutcome; reason: string; pose: ParkingPose; contact: Point | null;
  steeringDegrees: number; power: number;
}
export type ParkingEvent =
  | { type: 'angle'; steeringDegrees: number }
  | { type: 'launch'; power: number }
  | { type: 'park'; grade: ParkingGrade; points: number; streak: number; parked: number }
  | { type: 'failure'; outcome: ParkingOutcome }
  | { type: 'milestone'; milestone: 'parked10' }
  | { type: 'choice'; milestone: 'parked10'; choice: ParkingChoice };
export interface ParkingInspection extends ParkingSnapshot {
  layout: ParkingLayout; projection: ParkingPose[]; endpoint: ParkingPose;
  contact: Point | null; driveDistance: number; phaseTime: number;
}
export interface ParkingHooks {
  onUpdate: (snapshot: ParkingSnapshot) => void;
  onEnd: (result: ParkingResult) => void;
  onEvent: (event: ParkingEvent) => void;
}
export interface ParkingController {
  start: () => void; title: () => void; act: () => boolean; choose: (choice: ParkingChoice) => boolean;
  pause: (value: boolean) => void; snapshot: () => ParkingSnapshot;
  inspection: () => ParkingInspection; destroy: () => void;
}
