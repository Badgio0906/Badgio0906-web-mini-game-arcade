export type EchoPhase = 'watch' | 'recall' | 'between' | 'ended';
export interface EchoSnapshot {
  level: number;
  correctInputs: number;
  time: number;
  phase: EchoPhase;
  totalLength: number;
  index: number;
  highlightedCell: number | null;
  alive: boolean;
}
export interface EchoResult {
  level: number;
  correctInputs: number;
  time: number;
  expectedCell: number;
  actualCell: number;
  sequence: number[];
  reason: string;
}
export type EchoEvent =
  | { type: 'cue'; cell: number }
  | { type: 'correct'; cell: number }
  | { type: 'level_clear'; level: number }
  | { type: 'mistake'; expected: number; actual: number };
export interface EchoInspection extends EchoSnapshot {
  sequence: number[];
  expectedCell: number | null;
  flashSeconds: number;
  gapSeconds: number;
  remaining: number;
}
export interface EchoHooks {
  onUpdate: (snapshot: EchoSnapshot) => void;
  onEnd: (result: EchoResult) => void;
  onEvent: (event: EchoEvent) => void;
}
export interface EchoController {
  start: () => void;
  title: () => void;
  input: (cell: number) => boolean;
  pause: (value: boolean) => void;
  snapshot: () => EchoSnapshot;
  inspection: () => EchoInspection;
  destroy: () => void;
}
