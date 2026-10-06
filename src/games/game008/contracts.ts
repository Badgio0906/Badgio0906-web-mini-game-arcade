export type CoffeeDirection = -1 | 0 | 1;
export type CoffeePace = 'careful' | 'rush';
export type CoffeeChoice = 'decline' | 'accept';
export type CoffeeHazardType = 'step' | 'corner' | 'seam';
export interface CoffeeHazard { id: number; type: CoffeeHazardType; name: string; side: -1 | 1; distance: number; length: number; warned: boolean; started: boolean }
export interface CoffeeCup { id: number; name: string; remaining: number; liquidAngle: number; liquidVelocity: number; surfaceTilt: number; spilling: boolean; spillRate: number }
export interface CoffeeSnapshot { distance: number; legDistance: number; target: number; remainingDistance: number; score: number; time: number; legTime: number; deadline: number; remainingTime: number; alive: boolean; phase: 'walking' | 'choice' | 'ended'; bodyLean: number; bodyVelocity: number; input: CoffeeDirection; pace: CoffeePace; cups: CoffeeCup[]; cupCount: 1 | 2; minRemaining: number; pending: 'second_cup' | null; deliveries: number; preview: CoffeeHazard | null; activeEvent: CoffeeHazard | null; practice: boolean; }
export interface CoffeeResult { distance: number; score: number; time: number; cupCount: 1 | 2; cups: CoffeeCup[]; outcome: 'delivered' | 'timeout' | 'empty'; reason: string; deliveries: number; totalDeliveredRemaining: number; spareTime: number; rulesVersion: 2 }
export type CoffeeEvent = { type: 'warning' | 'hazard'; hazard: CoffeeHazard } | {type:'pace'; pace:CoffeePace; distance:number} | {type:'spill';cupId:number;remaining:number;amount:number;side:-1|1;hazard:string} | {type:'delivery';success:boolean;remaining:number;spareTime:number;cupCount:number} | {type:'choice';choice:CoffeeChoice;cupCount:number} | {type:'finish';outcome:string};
export interface CoffeeInspection extends CoffeeSnapshot { hazards: CoffeeHazard[] }
export interface CoffeeHooks { onUpdate:(s:CoffeeSnapshot)=>void; onEnd:(r:CoffeeResult)=>void; onEvent:(e:CoffeeEvent)=>void }
export interface CoffeeController { start:(practice?:boolean)=>void; title:()=>void; setInput:(d:CoffeeDirection)=>boolean; tap:(d:-1|1)=>boolean; choose:(c:CoffeeChoice)=>boolean; togglePace:()=>boolean; pause:(v:boolean)=>void; snapshot:()=>CoffeeSnapshot; inspection:()=>CoffeeInspection; destroy:()=>void }
