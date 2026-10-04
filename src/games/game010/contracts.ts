export type AttentionMode = 'listen' | 'work';
export type MeetingMode = 'normal' | 'board';
export type MeetingChoice = 'leave' | 'board';
export interface MeetingCue {
  id: number; kind: 'question' | 'feint'; cueStart: number; questionTime: number;
  warningSeconds: number; text: string;
}
export interface MeetingSnapshot {
  score: number; time: number; meetingSeconds: number; alive: boolean;
  mode: AttentionMode; meetingMode: MeetingMode; multiplier: 1 | 2;
  phase: 'talk' | 'cue' | 'answer' | 'ended'; pending: 'overtime' | null;
  currentCue: MeetingCue | null; cueRemaining: number | null;
  participants: number; answered: number; workSeconds: number;
}
export interface MeetingResult {
  score: number; time: number; meetingSeconds: number; mode: AttentionMode;
  meetingMode: MeetingMode; multiplier: 1 | 2; answered: number; workSeconds: number;
  outcome: 'caught' | 'safe_exit'; reason: string; question: MeetingCue | null;
}
export type MeetingEvent =
  | { type: 'toggle'; mode: AttentionMode }
  | { type: 'cue'; cue: MeetingCue }
  | { type: 'answer'; answered: number }
  | { type: 'feint_clear' }
  | { type: 'caught' }
  | { type: 'milestone'; milestone: 'overtime' }
  | { type: 'choice'; milestone: 'overtime'; choice: MeetingChoice; multiplier: 1 | 2 };
export interface MeetingInspection extends MeetingSnapshot {
  nextCue: MeetingCue | null; answerRemaining: number; milestoneOffered: boolean; exactScore: number;
}
export interface MeetingHooks {
  onUpdate: (snapshot: MeetingSnapshot) => void; onEnd: (result: MeetingResult) => void; onEvent: (event: MeetingEvent) => void;
}
export interface MeetingController {
  start: () => void; title: () => void; toggle: () => boolean; choose: (choice: MeetingChoice) => boolean;
  pause: (value: boolean) => void; snapshot: () => MeetingSnapshot; inspection: () => MeetingInspection; destroy: () => void;
}
