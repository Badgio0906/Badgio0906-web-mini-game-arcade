export type ParkingPhase = 'angle' | 'power' | 'driving' | 'parked' | 'choice' | 'slot-choice' | 'ended';
export type ParkingChoice = 'normal' | 'forbidden';
export type ParkingMode = 'normal' | 'forbidden';
export type ParkingSlotKind = 'safe' | 'challenge';
export type ParkingGrade = 'GOOD' | 'GREAT' | 'PERFECT PARK';
export type ParkingOutcome = 'collision' | 'outside';
export type ParkingFailureCause = 'collision' | 'angle' | 'short' | 'long' | 'unselected' | 'outside';
export interface Point { x: number; y: number }
export interface ParkingPose extends Point { rotation: number; width: number; height: number }
export interface ParkingObstacle extends ParkingPose { id: number; kind: 'car' | 'curb'; variant: number }
export interface ParkingLayout {
  id: number; templateId: string; name: string; start: ParkingPose; slot: ParkingPose;
  obstacles: ParkingObstacle[]; variant: number;
}
export interface ParkingPrecision { margin: number; centerError: number; angleError: number }
export interface ParkingSnapshot {
  score: number; parked: number; perfectCount: number; perfectStreak: number; maxStreak: number;
  time: number; alive: boolean; phase: ParkingPhase; pending: 'forbidden' | null; mode: ParkingMode;
  steeringDegrees: number; power: number; lockedSteering: number | null; lockedPower: number | null;
  grade: ParkingGrade | null; pose: ParkingPose; streakMultiplier: number; modeMultiplier: number;
  outcome: ParkingOutcome | null; rulesVersion: 2; slotKind: ParkingSlotKind; slotMultiplier: number;
  brakeUsed: boolean; braking: boolean; nearMisses: number; nearMissPoints: number; noBrakePoints: number;
  precision: ParkingPrecision | null; minClearance: number | null;
}
export interface ParkingResult {
  score: number; parked: number; perfectCount: number; maxStreak: number; time: number; mode: ParkingMode;
  outcome: ParkingOutcome; reason: string; cause: ParkingFailureCause; pose: ParkingPose; contact: Point | null;
  steeringDegrees: number; power: number; rulesVersion: 2; slotKind: ParkingSlotKind; brakeUsed: boolean;
}
export type ParkingEvent =
  | { type: 'angle'; steeringDegrees: number }
  | { type: 'launch'; power: number }
  | { type: 'brake'; distance: number; remaining: number; speed: number }
  | { type: 'slot_choice'; slot: ParkingSlotKind; multiplier: number }
  | { type: 'near_miss'; count: number; points: number; clearance: number }
  | { type: 'park'; grade: ParkingGrade; points: number; streak: number; parked: number; basePoints: number; noBrakePoints: number; nearMissPoints: number; slot: ParkingSlotKind; brakeUsed: boolean; margin: number; angleError: number }
  | { type: 'failure'; outcome: ParkingOutcome; cause: ParkingFailureCause; brakeUsed: boolean; slot: ParkingSlotKind }
  | { type: 'milestone'; milestone: 'parked10' }
  | { type: 'choice'; milestone: 'parked10'; choice: ParkingChoice };
export interface ParkingInspection extends ParkingSnapshot {
  layout: ParkingLayout; projection: ParkingPose[]; endpoint: ParkingPose;
  options: Array<{ kind: ParkingSlotKind; layout: ParkingLayout }>;
  contact: Point | null; driveDistance: number; driven: number; phaseTime: number;
}
export interface ParkingHooks {
  onUpdate: (snapshot: ParkingSnapshot) => void;
  onEnd: (result: ParkingResult) => void;
  onEvent: (event: ParkingEvent) => void;
}
export interface ParkingController {
  start: () => void; startPractice: (step: number) => void; title: () => void; act: () => boolean; choose: (choice: ParkingChoice) => boolean;
  chooseSlot: (choice: ParkingSlotKind) => boolean;
  pause: (value: boolean) => void; snapshot: () => ParkingSnapshot;
  inspection: () => ParkingInspection; destroy: () => void;
}
