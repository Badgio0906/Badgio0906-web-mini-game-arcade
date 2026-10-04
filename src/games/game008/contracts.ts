export type CoffeeDirection = -1 | 0 | 1;
export type CoffeeChoice = 'decline' | 'accept';
export type CoffeeMilestone = 'second_cup' | 'third_cup';
export type CoffeeHazardType = 'people' | 'step' | 'stop' | 'door' | 'train';
export interface CoffeeHazard { id: number; type: CoffeeHazardType; name: string; side: -1 | 1; onsetTime: number; warningStart: number; duration: number }
export interface CoffeeCup {
  id: number; name: string; remaining: number; liquidAngle: number; liquidVelocity: number;
  surfaceTilt: number; spilling: boolean; spillRate: number; frequency: number; damping: number;
}
export interface CoffeeSnapshot {
  distance: number; score: number; time: number; alive: boolean; phase: 'walking' | 'choice' | 'ended';
  bodyLean: number; bodyVelocity: number; input: CoffeeDirection; cups: CoffeeCup[]; cupCount: 1 | 2 | 3;
  minRemaining: number; pending: CoffeeMilestone | null; multiplier: 1 | 1.5 | 2;
  preview: CoffeeHazard | null; activeEvent: CoffeeHazard | null;
}
export interface CoffeeResult {
  distance: number; score: number; time: number; cupCount: 1 | 2 | 3; multiplier: 1 | 1.5 | 2;
  cups: CoffeeCup[]; outcome: 'empty'; reason: string; emptyCupId: number; emptyCupName: string;
}
export type CoffeeEvent =
  | { type: 'warning'; hazard: CoffeeHazard }
  | { type: 'hazard'; hazard: CoffeeHazard }
  | { type: 'spill'; cupId: number; remaining: number; amount: number }
  | { type: 'empty'; cupId: number }
  | { type: 'milestone'; milestone: CoffeeMilestone }
  | { type: 'choice'; milestone: CoffeeMilestone; choice: CoffeeChoice; cupCount: 1 | 2 | 3 };
export interface CoffeeInspection extends CoffeeSnapshot { hazards: CoffeeHazard[]; bodyAcceleration: number; tapRemaining: number }
export interface CoffeeHooks {
  onUpdate: (snapshot: CoffeeSnapshot) => void; onEnd: (result: CoffeeResult) => void; onEvent: (event: CoffeeEvent) => void;
}
export interface CoffeeController {
  start: () => void; title: () => void; setInput: (direction: CoffeeDirection) => boolean; tap: (direction: -1 | 1) => boolean;
  choose: (choice: CoffeeChoice) => boolean; pause: (value: boolean) => void;
  snapshot: () => CoffeeSnapshot; inspection: () => CoffeeInspection; destroy: () => void;
}
