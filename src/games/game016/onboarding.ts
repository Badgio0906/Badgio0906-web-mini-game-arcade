import type { StorageService } from '../../core/StorageService';
import type { TelemetryService } from '../../core/TelemetryService';
import type { Hand } from './types';
export interface LosePracticeSnapshot {
  phase: 'closed' | 'explanation' | 'practice' | 'complete';
  step: number; opponentHand: Hand; feedback: string; complete: boolean;
}
const opponents: readonly Hand[] = ['rock', 'scissors', 'paper'];
const answers: readonly Hand[] = ['scissors', 'paper', 'rock'];
/** Untimed, fixed practice samples. Never creates LoseRun or touches score/CREDIT/BEST. */
export function createLoseOnboarding(storage: StorageService, telemetry: TelemetryService) {
  let phase: LosePracticeSnapshot['phase'] = 'closed', step = 0, feedback = '';
  return {
    needed: (): boolean => !storage.readBoolean('tutorialCompleted', false),
    explain(): void { phase = 'explanation'; step = 0; feedback = ''; telemetry.trackEvent('tutorial_view'); telemetry.trackEvent('tutorial_start', { practiceAgain: storage.readBoolean('tutorialCompleted', false) }); },
    practice(): void { telemetry.trackEvent('practice_start'); phase = 'practice'; step = 0; feedback = '相手に負ける手を選ぼう。時間制限なし。'; },
    answer(hand: Hand): boolean {
      if (phase !== 'practice') return false;
      if (hand !== answers[step]) { feedback = hand === opponents[step] ? 'あいこです。練習は続きます。負ける手を選ぼう。' : '勝ってしまいました！ もう一度、負ける手を。'; return false; }
      step++; telemetry.trackEvent('tutorial_step_complete', { step });
      if (step === 3) { telemetry.trackEvent('practice_complete'); phase = 'complete'; feedback = 'OK！ 勝ったら負けです。負ければ正解です。'; }
      else feedback = '正解、負け！ 次の相手にも負けてみよう。';
      return true;
    },
    finish(): boolean { if (phase !== 'complete') return false; storage.writeBoolean('tutorialCompleted', true); telemetry.trackEvent('tutorial_complete'); phase = 'closed'; return true; },
    close(): void { if (phase !== 'closed') telemetry.trackEvent('tutorial_skip', { completedBefore: storage.readBoolean('tutorialCompleted', false) }); phase = 'closed'; },
    snapshot(): LosePracticeSnapshot { return Object.freeze({ phase, step, opponentHand: opponents[Math.min(2, step)], feedback, complete: phase === 'complete' }); },
  };
}
